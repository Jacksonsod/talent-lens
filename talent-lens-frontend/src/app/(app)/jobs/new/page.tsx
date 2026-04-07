"use client";

import React from "react";
import JobForm from "@/components/jobs/JobForm";

export default function NewJobPage() {
  return (
    <div className="max-w-4xl mx-auto stagger pb-20">
      <div className="mb-8">
        <h1
          className="font-display font-bold text-2xl tracking-tight mb-2"
          style={{ color: "var(--text)" }}
        >
          Create New Job
        </h1>
        <p className="text-sm" style={{ color: "var(--text3)" }}>
          Define the role and required skills to start the Gemini 1.5 Pro AI screening process.
        </p>
      </div>

      <JobForm />
    </div>
  );
}
