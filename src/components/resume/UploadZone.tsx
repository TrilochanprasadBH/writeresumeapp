"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadResult } from "@/types";

const ACCEPTED_TYPES = ".pdf,.doc,.docx";
const MAX_MB = 5;

interface UploadZoneProps {
  onUploaded: (result: UploadResult) => void;
  onError: (error: string) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  error?: string;
}

export function UploadZone({
  onUploaded,
  onError,
  isUploading,
  setIsUploading,
  error,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side size check (fast feedback)
      if (file.size > MAX_MB * 1024 * 1024) {
        onError(`File too large. Max size is ${MAX_MB}MB.`);
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedTypes.includes(file.type)) {
        onError("Invalid file type. Please upload a PDF or DOCX file.");
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Upload failed. Please try again.");
        }

        onUploaded({
          uploadId: data.uploadId,
          charCount: data.charCount,
          fileName: data.fileName,
        });
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Upload failed. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded, onError, setIsUploading]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-uploaded after an error
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
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
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={isUploading}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Reading your resume…
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Extracting text, usually under 5 seconds
              </p>
            </div>
          </>
        ) : error ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <p className="mt-1 text-xs text-gray-500">
                Click or drag to try a different file
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 transition-transform group-hover:scale-110">
              <Upload className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drop your resume here
              </p>
              <p className="mt-1 text-xs text-gray-400">
                or tap to browse · PDF or DOCX · Max {MAX_MB}MB
              </p>
            </div>
          </>
        )}
      </button>

      {/* Format hint */}
      {!error && !isUploading && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> PDF
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> DOCX
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> DOC
          </span>
        </div>
      )}
    </div>
  );
}
