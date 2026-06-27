import type { AnalysisResult, RejectionSignal, ResumeSection, ScoreLabel } from "@/types";

// ─── Model fallback chain ────────────────────────────────────
const MODELS = [
  "deepseek/deepseek-v4-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-flash-1.5-8b",
];


const SYSTEM_PROMPT = `You are a professional resume analyst and hiring consultant with 15 years of experience across tech, finance, healthcare, and non-technical roles.

Analyze the resume and return ONLY valid JSON — no markdown, no explanation outside the JSON object.

JSON shape:
{
  "inferredRole": "<most likely job title targeted by this resume>",
  "atsScore": <integer 0-100>,
  "atsLabel": "<'Strong' | 'Moderate' | 'Weak'>",
  "atsReason": "<one sentence on ATS keyword coverage>",
  "hirabilityScore": <integer 0-100>,
  "hirabilityLabel": "<'Strong' | 'Moderate' | 'Weak'>",
  "hirabilityReason": "<one sentence on overall hireability>",
  "sections": [
    { "label": "Experience",     "score": <0-100>, "weight": 25 },
    { "label": "Projects",       "score": <0-100>, "weight": 35 },
    { "label": "Skills",         "score": <0-100>, "weight": 20 },
    { "label": "Resume Clarity", "score": <0-100>, "weight": 10 },
    { "label": "Education",      "score": <0-100>, "weight": 10 }
  ],
  "rejectionSignals": [
    {
      "signal": "<short name, max 8 words>",
      "detail": "<1-2 sentences of evidence from the resume>",
      "severity": "<'high' | 'medium' | 'low'>"
    }
  ]
}

Scoring rules:
- ATS Score: keyword density, presence of standard sections, measurable metrics, format parsability.
- Hireability Score: impact bullet points, quantified achievements, career progression, role relevance.
- Section scores are independent evaluations of each resume section. They can be high even if overall scores are lower.
- Rejection Signals: 3-6 concrete, evidence-based reasons a recruiter or ATS would screen this out. Reference actual content (or its absence). Severity: high = immediate disqualifier, medium = notable weakness, low = minor issue.
- Label: Strong = 70-100, Moderate = 45-69, Weak = 0-44.
- Be honest and specific. Vague feedback is not useful.
- If the file is not a resume, set both scores to 0, label "Weak", single signal "Not a resume" severity "high".`;

interface OpenRouterResponse {
  choices: Array<{ message: { content: string }; model?: string }>;
  model?: string;
}

// Max visible score — no resume ever reaches "Strong" (threshold 70).
// Thresholds are scaled proportionally: Moderate ≥ round(45 * CAP/100).
const SCORE_CAP = 60;
const STRONG_THRESHOLD = Math.round(70 * SCORE_CAP / 100);   // 42
const MODERATE_THRESHOLD = Math.round(45 * SCORE_CAP / 100); // 27

function scaleScore(aiScore: number): number {
  const clamped = Math.min(100, Math.max(0, Number(aiScore) || 0));
  return Math.round((clamped / 100) * SCORE_CAP);
}

function labelFromScore(score: number): ScoreLabel {
  if (score >= STRONG_THRESHOLD) return "Strong";
  if (score >= MODERATE_THRESHOLD) return "Moderate";
  return "Weak";
}

function parseAIResponse(
  raw: string,
  modelUsed: string
): Omit<AnalysisResult, "id"> {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const atsScore = scaleScore(Number(parsed.atsScore));
  const hirabilityScore = scaleScore(Number(parsed.hirabilityScore));

  // ── Parse sections ────────────────────────────────────────
  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const defaultSections = [
    { label: "Experience", weight: 25 },
    { label: "Projects", weight: 35 },
    { label: "Skills", weight: 20 },
    { label: "Resume Clarity", weight: 10 },
    { label: "Education", weight: 10 },
  ];
  const sections: ResumeSection[] = defaultSections.map((def, i) => {
    const s = rawSections[i] as Record<string, unknown> | undefined;
    return {
      label: def.label,
      score: Math.min(100, Math.max(0, Number(s?.score) || 0)),
      weight: def.weight,
    };
  });

  // ── Parse rejection signals ────────────────────────────────
  const signals: RejectionSignal[] = Array.isArray(parsed.rejectionSignals)
    ? (parsed.rejectionSignals as RejectionSignal[]).slice(0, 6).map((s) => ({
        signal: String(s.signal || "").slice(0, 80),
        detail: String(s.detail || "").slice(0, 400),
        severity: (["high", "medium", "low"].includes(String(s.severity))
          ? s.severity
          : "medium") as RejectionSignal["severity"],
      }))
    : [];

  return {
    inferredRole: String(parsed.inferredRole || "General Role").slice(0, 100),
    atsScore,
    atsLabel: labelFromScore(atsScore),
    atsReason: String(parsed.atsReason || "").slice(0, 300),
    hirabilityScore,
    hirabilityLabel: labelFromScore(hirabilityScore),
    hirabilityReason: String(parsed.hirabilityReason || "").slice(0, 300),
    sections,
    rejectionSignals: signals,
    modelUsed,
  };
}

export async function analyzeResume(
  resumeText: string
): Promise<{ result: Omit<AnalysisResult, "id">; processingMs: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://resumelens.app";
  const startMs = Date.now();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": "ResumeLens",
    },
    body: JSON.stringify({
      models: MODELS,
      route: "fallback",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this resume:\n\n---\n${resumeText}\n---`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[openrouter] error:", response.status, errText);
    throw new Error(
      response.status === 429
        ? "AI service is busy. Please try again in a moment."
        : "AI analysis failed. Please try again."
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const raw = data.choices?.[0]?.message?.content ?? "";
  const modelUsed = data.model ?? data.choices?.[0]?.model ?? MODELS[0];

  return { result: parseAIResponse(raw, modelUsed), processingMs: Date.now() - startMs };
}
