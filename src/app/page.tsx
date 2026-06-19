import { Logo } from "@/components/Logo";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Contact } from "@/components/landing/Contact";
import { AnalysisApp } from "@/components/resume/AnalysisApp";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo size="sm" />
          <nav className="hidden gap-6 text-sm font-medium text-gray-600 sm:flex">
            <a
              href="#checker"
              className="transition-colors hover:text-emerald-600"
            >
              Check Resume
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-emerald-600"
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="transition-colors hover:text-emerald-600"
            >
              Contact
            </a>
          </nav>
          {/* Mobile: just show "Check Resume" CTA */}
          <a
            href="#checker"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white sm:hidden"
          >
            Check Resume
          </a>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────── */}
        <Hero />

        {/* ── Resume checker widget ────────────────────────── */}
        <section id="checker" className="bg-white px-4 py-16">
          <div className="mx-auto max-w-lg">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Check your resume now
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Free · No sign-up · Results in under 30 seconds
              </p>
            </div>
            <AnalysisApp />
          </div>
        </section>

        {/* ── How it works ────────────────────────────────── */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* ── Contact ─────────────────────────────────────── */}
        <Contact />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
          <Logo size="sm" />
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ResumeLens. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="/privacy" className="hover:text-gray-600">
              Privacy
            </a>
            <a href="/terms" className="hover:text-gray-600">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
