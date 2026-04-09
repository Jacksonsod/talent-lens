"use client";

import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { resetScreeningState } from "@/lib/slices/screeningSlice";

export default function ScreeningOverlay() {
  const dispatch = useAppDispatch();
  const { isScreening, progress, log } = useAppSelector((s) => s.screening);

  if (!isScreening) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-[480px] rounded-2xl p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          className="font-display font-bold text-lg mb-1"
          style={{ color: "#f0f0f5" }}
        >
          AI Screening in Progress
        </div>
        <div className="text-[13px] mb-6" style={{ color: "#5a5a72" }}>
          Gemini is analyzing all candidates against the job criteria
        </div>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full overflow-hidden mb-6"
          style={{ background: "var(--surface3)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "#7c6fff" }}
          />
        </div>

        {/* Log */}
        <div
          className="h-40 overflow-y-auto flex flex-col gap-2 mb-5"
          style={{ scrollBehavior: "smooth" }}
          ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
        >
          {log.map((entry, i) => (
            <div
              key={i}
              className="text-[12px] px-3 py-2 rounded-md"
              style={{
                background: "var(--surface2)",
                color: i === log.length - 1 ? "#f0f0f5" : "#9090a8",
                borderLeft: `2px solid ${i === log.length - 1 ? "#7c6fff" : "transparent"}`,
                animation: "fadeUp 0.3s ease forwards",
              }}
            >
              {entry}
            </div>
          ))}
        </div>

        <div className="text-right">
          <button
            className="px-4 py-2 rounded-lg text-[13px] border transition-colors"
            style={{
              background: "transparent",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#9090a8",
            }}
            onClick={() => dispatch(resetScreeningState())}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
