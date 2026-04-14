"use client";

import { X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import UmuravaWizardForm from "./UmuravaWizardForm";

const TOTAL_STEPS = 7;

const steps = [
  { label: "Basic Info", required: true },
  { label: "Skills & Languages", required: true },
  { label: "Work Experience", required: true },
  { label: "Education", required: true },
  { label: "Projects", required: true },
  { label: "Availability", required: true },
  { label: "Social Links", required: false },
];

interface Props {
  open: boolean;
  jobId: string;
  jobTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProfileWizardModal({
  open,
  jobId,
  jobTitle,
  onClose,
  onSuccess,
}: Props) {
  const [animate, setAnimate] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimate(true));
      document.body.style.overflow = "hidden";
    } else {
      setAnimate(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => {
      setCurrentStep(0);
      onClose();
    }, 200);
  };

  const pct = Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          opacity: animate ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Modal Panel — wider to fit sidebar */}
      <div
        className="relative w-full max-w-5xl mx-4 my-6 max-h-[calc(100vh-48px)] flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          transform: animate ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          opacity: animate ? 1 : 0,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface3)]"
              style={{ color: "var(--text2)" }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2
                className="font-display font-bold text-[16px] tracking-tight"
                style={{ color: "var(--text)" }}
              >
                Add Applicant — Structured Profile
              </h2>
              {jobTitle && (
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text3)" }}>
                  Targeting: <span style={{ color: "var(--accent)" }}>{jobTitle}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[rgba(220,38,38,0.08)]"
            style={{ color: "var(--text3)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--red)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text3)";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: sidebar + form */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── Left sidebar step nav ─── */}
          <div
            className="w-[220px] shrink-0 overflow-y-auto hidden md:flex flex-col"
            style={{
              background: "var(--surface2)",
              borderRight: "1px solid var(--border)",
            }}
          >
            {/* Progress */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
                  Progress
                </span>
                <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                  {pct}%
                </span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
            </div>

            {/* Step list */}
            <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
              {steps.map((s, i) => {
                const active = i === currentStep;
                const visited = i < currentStep;

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className="flex items-center gap-2.5 rounded-xl text-left transition-all duration-150 w-full group"
                    style={{
                      padding: "9px 10px",
                      background: active ? "var(--accent-dim)" : "transparent",
                    }}
                  >
                    {/* Step circle */}
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                      style={{
                        background: visited
                          ? "var(--green)"
                          : active
                            ? "var(--accent)"
                            : "transparent",
                        border: visited || active ? "none" : "1.5px solid var(--border2)",
                        color: visited || active ? "#fff" : "var(--text3)",
                      }}
                    >
                      {visited ? "✓" : i + 1}
                    </span>

                    {/* Label */}
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-[12px] leading-tight truncate"
                        style={{
                          color: active
                            ? "var(--accent)"
                            : visited
                              ? "var(--green)"
                              : "var(--text2)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>

                    {/* Required dot */}
                    {s.required && !visited && (
                      <span
                        className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
                        style={{ background: "var(--red)" }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ─── Right: form content ─── */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <UmuravaWizardForm
              jobId={jobId}
              onSuccess={onSuccess}
              step={currentStep}
              onStepChange={setCurrentStep}
              hideTopNav
            />
          </div>
        </div>
      </div>
    </div>
  );
}
