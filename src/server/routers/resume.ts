import { TRPCError } from "@trpc/server";
import { router, rateLimitedProcedure } from "../trpc";
import { LeadSchema } from "@/lib/validations";
import { analyzeResume } from "@/lib/openrouter";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordRateLimitEvent } from "@/lib/rate-limit";
import type { RejectionSignal, ResumeSection } from "@/types";

function sanitizeSignals(raw: unknown): RejectionSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).map((s) => ({
    signal: String((s as Record<string, unknown>).signal || "").slice(0, 80),
    detail: String((s as Record<string, unknown>).detail || "").slice(0, 400),
    severity: (["high", "medium", "low"].includes(String((s as Record<string, unknown>).severity))
      ? (s as Record<string, unknown>).severity
      : "medium") as RejectionSignal["severity"],
  }));
}

function sanitizeSections(raw: unknown): ResumeSection[] {
  const defaults = [
    { label: "Experience", weight: 25 },
    { label: "Projects", weight: 35 },
    { label: "Skills", weight: 20 },
    { label: "Resume Clarity", weight: 10 },
    { label: "Education", weight: 10 },
  ];
  const arr = Array.isArray(raw) ? raw : [];
  return defaults.map((def, i) => {
    const s = arr[i] as Record<string, unknown> | undefined;
    return { label: def.label, score: Math.min(100, Math.max(0, Number(s?.score) || 0)), weight: def.weight };
  });
}

export const resumeRouter = router({
  /**
   * analyze — the core mutation.
   * 1. Validates input (lead info + uploadId)
   * 2. Fetches resume text from Supabase
   * 3. Records lead
   * 4. Calls OpenRouter for analysis
   * 5. Persists result
   * 6. Returns scores to client
   */
  analyze: rateLimitedProcedure
    .input(LeadSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getSupabaseAdmin();

      // ── 1. Fetch uploaded resume text ──────────────────────
      const { data: upload, error: uploadError } = await db
        .from("resume_uploads")
        .select("resume_text, file_name, expires_at, content_hash")
        .eq("id", input.uploadId)
        .single();

      if (uploadError || !upload) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Resume upload not found or expired. Please upload your resume again.",
        });
      }

      // Check expiry
      if (new Date(upload.expires_at) < new Date()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Your upload session expired. Please upload your resume again.",
        });
      }

      // ── 2. Check for cached analysis (same resume content) ─
      let cachedAnalysis: {
        id: string;
        inferred_role: string;
        ats_score: number;
        ats_label: string;
        ats_reason: string;
        hireability_score: number;
        hireability_label: string;
        hireability_reason: string;
        rejection_signals: unknown;
        sections: unknown;
        model_used: string;
      } | null = null;

      if (upload.content_hash) {
        const { data: existing } = await db
          .from("analyses")
          .select(
            "id, inferred_role, ats_score, ats_label, ats_reason, hireability_score, hireability_label, hireability_reason, rejection_signals, sections, model_used"
          )
          .eq("content_hash", upload.content_hash)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existing) cachedAnalysis = existing;
      }

      // ── 3. Save lead ───────────────────────────────────────
      const { data: lead, error: leadError } = await db
        .from("leads")
        .insert({
          name: input.name,
          email: input.email,
          phone: input.phone,
          ip_address: ctx.ipAddress,
        })
        .select("id")
        .single();

      if (leadError || !lead) {
        console.error("[resume.analyze] lead insert error:", leadError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save contact info. Please try again.",
        });
      }

      // ── 4. Record rate limit event ─────────────────────────
      await recordRateLimitEvent(ctx.ipAddress, input.email);

      // ── 5. Clean up upload (best-effort) ──────────────────
      await db.from("resume_uploads").delete().eq("id", input.uploadId);

      // ── 6. Return cached result if available ───────────────
      if (cachedAnalysis) {
        const { data: analysis } = await db
          .from("analyses")
          .insert({
            lead_id: lead.id,
            upload_id: input.uploadId,
            content_hash: upload.content_hash,
            inferred_role: cachedAnalysis.inferred_role,
            ats_score: cachedAnalysis.ats_score,
            ats_label: cachedAnalysis.ats_label,
            ats_reason: cachedAnalysis.ats_reason,
            hireability_score: cachedAnalysis.hireability_score,
            hireability_label: cachedAnalysis.hireability_label,
            hireability_reason: cachedAnalysis.hireability_reason,
            rejection_signals: cachedAnalysis.rejection_signals,
            sections: cachedAnalysis.sections,
            model_used: cachedAnalysis.model_used,
            served_from_cache: true,
          })
          .select("id")
          .single();

        return {
          id: analysis?.id ?? cachedAnalysis.id,
          inferredRole: String(cachedAnalysis.inferred_role || "General Role").slice(0, 100),
          atsScore: Math.min(60, Math.max(0, Number(cachedAnalysis.ats_score) || 0)),
          atsLabel: (["Strong", "Moderate", "Weak"].includes(cachedAnalysis.ats_label)
            ? cachedAnalysis.ats_label
            : "Weak") as "Strong" | "Moderate" | "Weak",
          atsReason: String(cachedAnalysis.ats_reason || "").slice(0, 300),
          hirabilityScore: Math.min(60, Math.max(0, Number(cachedAnalysis.hireability_score) || 0)),
          hirabilityLabel: (["Strong", "Moderate", "Weak"].includes(cachedAnalysis.hireability_label)
            ? cachedAnalysis.hireability_label
            : "Weak") as "Strong" | "Moderate" | "Weak",
          hirabilityReason: String(cachedAnalysis.hireability_reason || "").slice(0, 300),
          rejectionSignals: sanitizeSignals(cachedAnalysis.rejection_signals),
          sections: sanitizeSections(cachedAnalysis.sections),
          modelUsed: String(cachedAnalysis.model_used || ""),
        };
      }

      // ── 7. Call OpenRouter ─────────────────────────────────
      let aiResult: Awaited<ReturnType<typeof analyzeResume>>;
      try {
        aiResult = await analyzeResume(upload.resume_text);
      } catch (err) {
        console.error("[resume.analyze] OpenRouter error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "AI analysis failed. Please try again.",
        });
      }

      // ── 8. Persist result ──────────────────────────────────
      const { data: analysis, error: analysisError } = await db
        .from("analyses")
        .insert({
          lead_id: lead.id,
          upload_id: input.uploadId,
          content_hash: upload.content_hash,
          inferred_role: aiResult.result.inferredRole,
          ats_score: aiResult.result.atsScore,
          ats_label: aiResult.result.atsLabel,
          ats_reason: aiResult.result.atsReason,
          hireability_score: aiResult.result.hirabilityScore,
          hireability_label: aiResult.result.hirabilityLabel,
          hireability_reason: aiResult.result.hirabilityReason,
          rejection_signals: aiResult.result.rejectionSignals,
          sections: aiResult.result.sections,
          model_used: aiResult.result.modelUsed,
          processing_ms: aiResult.processingMs,
          served_from_cache: false,
        })
        .select("id")
        .single();

      if (analysisError || !analysis) {
        console.error("[resume.analyze] analysis insert error:", analysisError);
        // Non-fatal — we still return the result to the user
      }

      // ── 9. Return to client ────────────────────────────────
      return {
        id: analysis?.id ?? "local",
        ...aiResult.result,
      };
    }),
});
