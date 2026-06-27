import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validations";
import { extractResumeText, looksLikeResume } from "@/lib/resume-parser";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, recordRateLimitEvent } from "@/lib/rate-limit";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  // ── Rate limit check ───────────────────────────────────────
  // x-real-ip is set by middleware from Vercel's trusted req.ip
  const ip = req.headers.get("x-real-ip") ?? "127.0.0.1";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }
  await recordRateLimitEvent(ip);

  // ── Parse multipart form ───────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("Could not parse form data.");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return errorResponse("No file provided.");
  }

  // ── Validate file type ─────────────────────────────────────
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return errorResponse(
      "Invalid file type. Please upload a PDF or Word document (.docx)."
    );
  }

  // ── Validate file size ─────────────────────────────────────
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return errorResponse(
      `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`
    );
  }

  // ── Extract text ───────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  let charCount: number;
  try {
    ({ text, charCount } = await extractResumeText(buffer, file.type));
  } catch (err) {
    return errorResponse(
      err instanceof Error
        ? err.message
        : "Failed to read file. Please try a different format."
    );
  }

  // ── Sanity check ───────────────────────────────────────────
  const isResume = looksLikeResume(text);
  // We allow it through either way but flag it

  // ── Hash resume text for deduplication ────────────────────
  const contentHash = createHash("sha256").update(text).digest("hex");

  // ── Store in Supabase ──────────────────────────────────────
  const db = getSupabaseAdmin();
  const { data, error: dbError } = await db
    .from("resume_uploads")
    .insert({
      resume_text: text,
      file_name: file.name,
      char_count: charCount,
      content_hash: contentHash,
    })
    .select("id")
    .single();

  if (dbError || !data) {
    console.error("[upload] Supabase insert error:", dbError);
    return errorResponse("Failed to store upload. Please try again.", 500);
  }

  return NextResponse.json({
    uploadId: data.id,
    charCount,
    fileName: file.name,
    warning: !isResume
      ? "This file may not be a resume. Please double-check."
      : null,
  });
}
