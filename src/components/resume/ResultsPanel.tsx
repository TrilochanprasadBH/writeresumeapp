"use client";

import { RotateCcw, ShieldAlert, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getScoreColor, getSeverityColor } from "@/lib/utils";
import type { AnalysisResult, ScoreLabel } from "@/types";

// ── Score circle ─────────────────────────────────────────────
interface ScoreCircleProps {
  score: number;
  label: ScoreLabel;
  title: string;
  subtitle: string;
}

function ScoreCircle({ score, label, title, subtitle }: ScoreCircleProps) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const stroke = score >= 70 ? "#16a34a" : score >= 45 ? "#d97706" : "#dc2626";
  const track = score >= 70 ? "#dcfce7" : score >= 45 ? "#fef3c7" : "#fee2e2";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
        <svg className="-rotate-90 absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className={`text-2xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs font-medium text-gray-400">/ 100</span>
        </div>
      </div>

      <Badge variant={label === "Strong" ? "success" : label === "Moderate" ? "warning" : "danger"}>
        {label}
      </Badge>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Section breakdown bar ────────────────────────────────────
function SectionBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const barColor =
    score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-400" : "bg-red-400";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
            {weight}%
          </span>
        </div>
        <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
interface ResultsPanelProps {
  data: AnalysisResult;
  onStartOver: () => void;
}

export function ResultsPanel({ data, onStartOver }: ResultsPanelProps) {
  const sortedSignals = [...data.rejectionSignals].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="w-full space-y-5 animate-fade-in">

      {/* Inferred role */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Resume analyzed as
        </p>
        <p className="mt-0.5 text-lg font-bold text-emerald-900">{data.inferredRole}</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ScoreCircle
          score={data.atsScore}
          label={data.atsLabel}
          title="ATS Score"
          subtitle="Keyword filter pass rate"
        />
        <ScoreCircle
          score={data.hirabilityScore}
          label={data.hirabilityLabel}
          title="Hireability"
          subtitle="Role-weighted strength"
        />
      </div>

      {/* Score explanations */}
      <div className="space-y-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ATS</p>
          <p className="mt-1 text-sm text-gray-700">{data.atsReason}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hireability</p>
          <p className="mt-1 text-sm text-gray-700">{data.hirabilityReason}</p>
        </div>
      </div>

      {/* Section breakdown */}
      {data.sections.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Section Breakdown
          </h3>
          <div className="space-y-4">
            {data.sections.map((s) => (
              <SectionBar key={s.label} label={s.label} score={s.score} weight={s.weight} />
            ))}
          </div>
        </div>
      )}

      {/* Rejection signals */}
      {sortedSignals.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-gray-900">Rejection Signals</h3>
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {sortedSignals.length} found
            </span>
          </div>
          <div className="space-y-3">
            {sortedSignals.map((signal, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3 ${getSeverityColor(signal.severity)}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    signal.severity === "high" ? "bg-red-500"
                    : signal.severity === "medium" ? "bg-amber-500"
                    : "bg-yellow-400"
                  }`} />
                  <div>
                    <p className="text-sm font-semibold">{signal.signal}</p>
                    <p className="mt-0.5 text-xs leading-relaxed opacity-80">{signal.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upsell CTA ─────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center">
        <div className="mb-1 text-2xl font-extrabold text-emerald-900">
          Want 10x more job offers?
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Our resume experts can rewrite your resume to clear ATS filters and land more interviews.
          Get a personalized review within 24 hours.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:hello@resumelens.app?subject=Expert Resume Review Request"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Mail className="h-4 w-4" />
            Email us for expert review
          </a>
          <a
            href="https://wa.me/1234567890?text=Hi%2C+I+want+a+resume+expert+review"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50 px-5 py-3 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
        <p className="mt-3 text-xs text-gray-400">No commitment · Turnaround in 24h</p>
      </div>

      {/* Model credit */}
      <p className="text-center text-xs text-gray-300">Analyzed by Specialist Resume AI Agent</p>

      {/* Start over */}
      <Button variant="outline" onClick={onStartOver} className="w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Analyze another resume
      </Button>
    </div>
  );
}
