"use client";

import { useCallback, useState } from "react";
import { useInterviewStore } from "@/context/InterviewContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function CVUploader() {
  const store = useInterviewStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await api.uploadCV(file);
        store.setCVData(res.cv_profile, res.cv_session_token);
        store.setSetupPhase("mode");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsLoading(false);
      }
    },
    [store],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-gray-400">Parsing your CV with AI...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📄</div>
            <p className="font-semibold mb-1">Drop your CV here</p>
            <p className="text-gray-400 text-sm mb-4">PDF, DOCX, or TXT · Max 5 MB</p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="sr-only"
                onChange={onInputChange}
              />
              <span className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none bg-white/10 hover:bg-white/20 text-white border border-white/10 px-3 py-1.5 text-sm">
                Browse files
              </span>
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
