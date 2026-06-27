import { Mail } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Get in touch
        </h2>
        <p className="mb-8 text-sm text-gray-500">
          Questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="mailto:knowledge8base@yahoo.com"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Mail className="h-4 w-4" />
            knowledge8base@yahoo.com
          </a>
        </div>
      </div>
    </section>
  );
}
