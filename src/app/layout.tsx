import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ResumeLens — Free ATS & Hireability Score",
  description:
    "Upload your resume and get an instant ATS score, hireability rating, and evidence-based rejection signals in seconds. Free, no sign-up required.",
  keywords: [
    "resume checker",
    "ATS score",
    "resume analysis",
    "hireability score",
    "resume feedback",
    "job application",
  ],
  openGraph: {
    title: "ResumeLens — Know why your resume gets rejected",
    description:
      "Free AI resume analysis. ATS score, hireability rating, and specific rejection signals.",
    type: "website",
    url: "https://resumelens.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeLens",
    description: "Free AI resume analysis. Get your ATS & hireability score.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
