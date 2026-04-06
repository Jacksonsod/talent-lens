"use client";

import React from "react";

// ─── LoadingSpinner ───────────────────────────
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        style={{ color: "#7c6fff" }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="40"
          strokeDashoffset="10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default LoadingSpinner;
