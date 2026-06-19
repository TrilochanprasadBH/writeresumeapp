export type ScoreLabel = "Strong" | "Moderate" | "Weak";
export type SignalSeverity = "high" | "medium" | "low";

export interface RejectionSignal {
  signal: string;
  detail: string;
  severity: SignalSeverity;
}

export interface ResumeSection {
  label: string;       // Display name e.g. "Experience"
  score: number;       // 0-100 (raw, not capped)
  weight: number;      // percentage weight e.g. 25
}

export interface AnalysisResult {
  id: string;
  inferredRole: string;
  atsScore: number;          // capped at 58
  atsLabel: ScoreLabel;
  atsReason: string;
  hirabilityScore: number;   // capped at 58
  hirabilityLabel: ScoreLabel;
  hirabilityReason: string;
  sections: ResumeSection[];
  rejectionSignals: RejectionSignal[];
  modelUsed: string;
}

export interface UploadResult {
  uploadId: string;
  charCount: number;
  fileName: string;
}

// Lead data captured before upload
export interface LeadData {
  name: string;
  email: string;
  phone: string;
}

// ─── App state machine ──────────────────────────────────────
// New flow: lead_form → uploading → analyzing → results
export type AppStep =
  | { step: "landing" }
  | { step: "lead_form" }
  | { step: "uploading"; leadData: LeadData }
  | { step: "upload_error"; error: string; leadData: LeadData }
  | { step: "analyzing"; uploadId: string; fileName: string }
  | { step: "analyze_error"; error: string; uploadId: string; fileName: string; leadData: LeadData }
  | { step: "results"; data: AnalysisResult };
