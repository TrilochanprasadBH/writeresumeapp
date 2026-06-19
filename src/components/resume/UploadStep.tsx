"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle, RefreshCw, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadResult, LeadData } from "@/types";

const ACCEPTED_TYPES = ".pdf,.doc,.docx";
const MAX_MB = 5;
const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

interface UploadStepProps {
  leadData: LeadData;
  onUploaded: (result: UploadResult) => void;
  onError: (error: string) => void;
  onBack: () => void;
  error?: string;
}

export function UploadStep({ leadData, onUploaded, onError, onBack, error }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_MB * 1024 * 1024) {
        onError(`File too large. Max ${MAX_MB}MB.`);
        return;
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        onError("Invalid file type. Upload a PDF or DOCX.");
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        onUploaded({ uploadId: data.uploadId, charCount: data.charCount, fileName: data.fileName });
      } catch (err) {
        onError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded, onError]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Lead summary pill */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-800">{leadData.name}</span>
          <span className="text-xs text-emerald-400">·</span>
          <span className="text-xs text-emerald-500">{leadData.email}</span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-600"
        >
          <ArrowLeft className="h-3 w-3" /> Edit
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="sr-only"
        onChange={onInputChange}
        aria-label="Upload resume file"
      />

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={isUploading}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          dragOver
            ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
            : error
            ? "border-red-300 bg-red-50 hover:border-red-400"
            : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50",
          isUploading && "cursor-not-allowed opacity-70"
        )}
      >
        {isUploading ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Reading your resume…</p>
              <p className="mt-1 text-xs text-gray-400">Extracting text, usually under 5s</p>
            </div>
          </>
        ) : error ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-700">{error}</p>
              <p className="mt-1 text-xs text-gray-500">Tap to try a different file</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Upload className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">Upload your resume</p>
              <p className="mt-1 text-sm text-gray-400">
                Drop here or tap to browse · PDF or DOCX · Max {MAX_MB}MB
              </p>
            </div>
            <span className="mt-2 inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
              Choose file
            </span>
          </>
        )}
      </button>

      {/* Format hints */}
      {!error && !isUploading && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
          {["PDF", "DOCX", "DOC"].map((fmt) => (
            <span key={fmt} className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> {fmt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
