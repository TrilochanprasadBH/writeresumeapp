import { z } from "zod";

export const LeadSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters"),

  email: z.string().email("Please enter a valid email address").max(254),

  phone: z
    .string()
    .min(7, "Phone number too short")
    .max(20, "Phone number too long")
    .regex(/^[+\d\s\-().]+$/, "Invalid phone number format"),

  uploadId: z.string().uuid("Invalid upload reference"),
});

export type LeadInput = z.infer<typeof LeadSchema>;

// File upload validation constants
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TEXT_CHARS = 50_000;
export const MIN_TEXT_CHARS = 100;
