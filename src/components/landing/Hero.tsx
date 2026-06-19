"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILE_COLS = 28;
const TILE_ROWS = 16;
const TILE_SIZE = 52;
const TILE_GAP = 3;
const STEP = TILE_SIZE + TILE_GAP;

// lightest (top-left) → darkest (bottom-right)
const SHADES = ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669"];

const mosaicTiles = Array.from({ length: TILE_ROWS }, (_, row) =>
  Array.from({ length: TILE_COLS }, (_, col) => {
    // 0 at top (light) → 1 at bottom (dark), purely vertical
    const baseIdx = (row / (TILE_ROWS - 1)) * (SHADES.length - 1);
    const noise = ((row * 13 + col * 19 + row * col * 7) % 7) - 3;
    const idx = Math.max(0, Math.min(SHADES.length - 1, Math.round(baseIdx + noise * 0.5)));
    return { row, col, color: SHADES[idx] };
  })
).flat();

const TRUST_SIGNALS = [
  "ATS keyword analysis",
  "Hireability scoring",
  "Rejection signal detection",
];

export function Hero() {
  const scrollToChecker = () => {
    document.getElementById("checker")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      {/* Mosaic tile background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox={`0 0 ${TILE_COLS * STEP} ${TILE_ROWS * STEP}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {mosaicTiles.map(({ row, col, color }) => (
            <rect
              key={`${row}-${col}`}
              x={col * STEP}
              y={row * STEP}
              width={TILE_SIZE}
              height={TILE_SIZE}
              fill={color}
              rx={3}
            />
          ))}
        </svg>
        {/* Top-to-bottom fade: near-white at top (text area), fully transparent at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/30 to-transparent" />
      </div>

      {/* Content — frosted glass card for readability */}
      <div className="relative mx-auto w-full max-w-2xl rounded-3xl bg-white/80 px-5 py-10 shadow-xl shadow-emerald-900/10 backdrop-blur-md sm:px-12 sm:py-12">
        <span className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Free Resume Analysis
        </span>

        <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
          Know exactly why your resume{" "}
          <span className="text-emerald-600">gets rejected</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
          Upload your resume and get an instant ATS score, hireability rating, and
          evidence-based rejection signals — before a recruiter sees it.
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {TRUST_SIGNALS.map((signal) => (
            <li key={signal} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {signal}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3">
          {/* Pulse ring + prominent CTA */}
          <div className="relative">
            <span className="absolute inset-0 rounded-xl bg-emerald-400 opacity-0 animate-[ctaPulse_2s_ease-out_infinite]" />
            <Button
              size="lg"
              onClick={scrollToChecker}
              className="relative w-full max-w-xs bg-emerald-500 px-10 py-4 text-lg font-bold shadow-lg shadow-emerald-500/40 transition-all duration-200 hover:scale-105 hover:bg-emerald-400 hover:shadow-emerald-400/50 sm:max-w-sm"
            >
              Check my resume free →
            </Button>
          </div>
          <p className="text-sm font-medium text-gray-500">No sign-up required · Free forever</p>
        </div>
      </div>

      <style>{`
        @keyframes ctaPulse {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.12); opacity: 0;   }
          100% { transform: scale(1.12); opacity: 0;   }
        }
      `}</style>
    </section>
  );
}
