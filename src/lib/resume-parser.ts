import { MIN_TEXT_CHARS, MAX_TEXT_CHARS } from "./validations";

/**
 * Extract plain text from a PDF or DOCX buffer (server-side only).
 * Returns extracted text, truncated to MAX_TEXT_CHARS.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; charCount: number }> {
  let raw = "";

  if (mimeType === "application/pdf") {
    // Dynamic import to avoid bundling on client
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer, {
      // Limit pages to avoid abuse (most resumes are 1-2 pages)
      max: 5,
    });
    raw = parsed.text;
  } else {
    // DOCX / DOC
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    raw = result.value;

    if (result.messages.length > 0) {
      const errors = result.messages.filter((m) => m.type === "error");
      if (errors.length > 0) {
        console.warn("[resume-parser] mammoth warnings:", errors);
      }
    }
  }

  // Clean up whitespace: collapse multiple blank lines
  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (cleaned.length < MIN_TEXT_CHARS) {
    throw new Error(
      "Could not extract enough text from this file. " +
        "Make sure it is a text-based PDF (not a scanned image) or a DOCX file."
    );
  }

  const text = cleaned.slice(0, MAX_TEXT_CHARS);
  return { text, charCount: text.length };
}

/**
 * Basic sanity check: does the content look like a resume?
 * Not a hard gate — just used to surface a warning.
 */
export function looksLikeResume(text: string): boolean {
  const lower = text.toLowerCase();
  const resumeKeywords = [
    "experience",
    "education",
    "skills",
    "work",
    "employment",
    "university",
    "college",
    "degree",
    "project",
    "certification",
  ];
  const matches = resumeKeywords.filter((k) => lower.includes(k));
  return matches.length >= 2;
}
