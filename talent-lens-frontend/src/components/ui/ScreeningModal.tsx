"use client";

import React, { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { resetScreeningState } from "@/lib/slices/screeningSlice";
import { cn } from "@/lib/utils/helpers";
import { useRouter } from "next/navigation";

interface ScreeningModalProps {
  onComplete?: () => void;
}

export default function ScreeningModal({ onComplete }: ScreeningModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isScreening, progress, log, screeningJobId } = useAppSelector((s) => s.screening);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isScreening) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isScreening, log.length]);

  if (!isScreening) return null;

  const handleComplete = () => {
    if (screeningJobId) {
      router.push(`/jobs/${screeningJobId}/shortlist`);
    }
    dispatch(resetScreeningState());
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-8 w-[480px] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="font-display font-bold text-xl mb-1" style={{ color: "var(--text)" }}>
          System AI Analysis
        </div>
        <div className="text-sm mb-6" style={{ color: "var(--text3)" }}>
          Processing candidates with System AI...
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-[var(--surface3)] rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Logs */}
        <div className="h-48 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
          {log.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "text-[12.5px] px-3 py-2.5 rounded-lg border-l-2 transition-all duration-300 animate-fade-up",
                i === log.length - 1
                  ? "bg-[var(--surface2)] border-[var(--accent)] text-[var(--text)] font-medium shadow-sm"
                  : "bg-[var(--surface2)] border-[var(--green)] text-[var(--text2)] opacity-80"
              )}
            >
              {entry}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          {progress < 100 ? (
            <button
              className="btn btn-ghost"
              onClick={() => dispatch(resetScreeningState())}
            >
              Cancel
            </button>
          ) : (
            <button
              className="btn btn-primary px-8"
              onClick={handleComplete}
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
