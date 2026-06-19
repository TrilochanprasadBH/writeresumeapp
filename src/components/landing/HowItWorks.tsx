import { Upload, UserCheck, BarChart3 } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload your resume",
    desc: "PDF or Word doc. No account needed.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: UserCheck,
    title: "Enter your details",
    desc: "Just your name, email, and phone — so we can send the full report.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: BarChart3,
    title: "Get your scores",
    desc: "ATS score, hireability rating, and specific rejection signals in seconds.",
    color: "bg-sky-100 text-sky-700",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          How it works
        </h2>
        <p className="mb-10 text-center text-sm text-gray-500">
          Three steps. Under 60 seconds.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className={`rounded-lg p-2 ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
