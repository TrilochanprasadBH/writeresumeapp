"use client";

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/utils/trpc";
import { LeadForm } from "./LeadForm";
import { UploadStep } from "./UploadStep";
import { AnalyzingLoader } from "./AnalyzingLoader";
import { ResultsPanel } from "./ResultsPanel";
import type { AppStep, LeadData, UploadResult } from "@/types";

export function AnalysisApp() {
  const [state, setState] = useState<AppStep>({ step: "landing" });

  // Persist lead data across upload → analyze transitions
  const leadRef = useRef<LeadData>({ name: "", email: "", phone: "" });
  // Persist upload context for retry
  const uploadCtxRef = useRef<{ uploadId: string; fileName: string }>({
    uploadId: "",
    fileName: "",
  });

  // ── tRPC analyze mutation ──────────────────────────────────
  const analyzeMutation = trpc.resume.analyze.useMutation({
    onSuccess(data) {
      setState({ step: "results", data });
    },
    onError(err) {
      setState({
        step: "analyze_error",
        error: err.message,
        uploadId: uploadCtxRef.current.uploadId,
        fileName: uploadCtxRef.current.fileName,
        leadData: leadRef.current,
      });
    },
  });

  // ── Step 1: lead form submitted ────────────────────────────
  const handleLeadSubmit = useCallback((data: LeadData) => {
    leadRef.current = data;
    setState({ step: "uploading", leadData: data });
  }, []);

  // ── Step 2: file uploaded ──────────────────────────────────
  const handleUploaded = useCallback(
    (result: UploadResult) => {
      uploadCtxRef.current = { uploadId: result.uploadId, fileName: result.fileName };
      setState({ step: "analyzing", uploadId: result.uploadId, fileName: result.fileName });
      analyzeMutation.mutate({
        name: leadRef.current.name,
        email: leadRef.current.email,
        phone: leadRef.current.phone,
        uploadId: result.uploadId,
      });
    },
    [analyzeMutation]
  );

  const handleUploadError = useCallback((error: string) => {
    setState((prev) => ({
      step: "upload_error",
      error,
      leadData:
        prev.step === "uploading" || prev.step === "upload_error"
          ? prev.leadData
          : leadRef.current,
    }));
  }, []);

  // ── Retry after analyze error ──────────────────────────────
  const handleRetryAnalysis = useCallback(() => {
    if (state.step === "analyze_error") {
      analyzeMutation.reset();
      setState({ step: "analyzing", uploadId: state.uploadId, fileName: state.fileName });
      analyzeMutation.mutate({
        name: leadRef.current.name,
        email: leadRef.current.email,
        phone: leadRef.current.phone,
        uploadId: state.uploadId,
      });
    }
  }, [state, analyzeMutation]);

  // ── Start over ─────────────────────────────────────────────
  const handleStartOver = useCallback(() => {
    analyzeMutation.reset();
    leadRef.current = { name: "", email: "", phone: "" };
    uploadCtxRef.current = { uploadId: "", fileName: "" };
    setState({ step: "landing" });
  }, [analyzeMutation]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Step 1 — Lead form (landing or came back from upload) */}
      {(state.step === "landing" || state.step === "lead_form") && (
        <LeadForm onSubmit={handleLeadSubmit} />
      )}

      {/* Step 2 — Upload (after form, or retry after upload error) */}
      {(state.step === "uploading" || state.step === "upload_error") && (
        <UploadStep
          leadData={state.leadData}
          onUploaded={handleUploaded}
          onError={handleUploadError}
          onBack={() => setState({ step: "landing" })}
          error={state.step === "upload_error" ? state.error : undefined}
        />
      )}

      {/* Step 3 — Analyzing */}
      {state.step === "analyzing" && <AnalyzingLoader />}

      {/* Analyze error */}
      {state.step === "analyze_error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center animate-fade-in">
          <p className="font-semibold text-red-700">{state.error}</p>
          <p className="mt-1 text-sm text-red-500">
            Your resume was uploaded successfully — the AI analysis failed.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={handleRetryAnalysis}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry analysis
            </button>
            <button
              onClick={handleStartOver}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Results */}
      {state.step === "results" && (
        <ResultsPanel data={state.data} onStartOver={handleStartOver} />
      )}
    </div>
  );
}
