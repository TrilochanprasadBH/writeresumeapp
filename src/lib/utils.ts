import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return score.toString();
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 45) return "text-amber-500";
  return "text-red-500";
}

export function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-50 border-green-200";
  if (score >= 45) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export function getSeverityColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}
