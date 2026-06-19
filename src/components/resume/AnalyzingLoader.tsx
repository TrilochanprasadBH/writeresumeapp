"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Parsing resume structure…",
  "Checking ATS keyword coverage…",
  "Evaluating hireability signals…",
  "Scanning for rejection patterns…",
  "Computing your scores…",
  "Almost there…",
];

export function AnalyzingLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 3000);

    // Fake progress: climbs to ~85% then stalls waiting for real response
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        return p + Math.random() * 4;
      });
    }, 600);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const pct = Math.min(85, Math.round(progress));

  return (
    <div className="flex w-full flex-col items-center gap-8 py-8 animate-fade-in">
      {/* Animated rings */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#E0E7FF"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="text-2xl font-bold text-emerald-700">{pct}%</span>
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">
          {MESSAGES[msgIndex]}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          AI analysis takes 10–20 seconds
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
