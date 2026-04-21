"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import JobForm from "@/components/jobs/JobForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const job = useAppSelector((s) => s.jobs.items.find((j) => j._id === id) || s.jobs.selected);
  const loading = useAppSelector((s) => s.jobs.loading);

  useEffect(() => {
    if (!job && id) {
      dispatch(fetchJobById(id));
    }
  }, [id, dispatch, job]);

  if (loading && !job) return <LoadingSpinner />;

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[var(--text3)]">Job not found.</p>
        <Link href="/jobs" className="btn btn-ghost">← Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="stagger space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--text3)" }}>
        <Link href="/jobs" className="hover:text-[var(--text2)] transition-colors flex items-center gap-1">
          <ArrowLeft size={13} /> All Jobs
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text2)" }}>Edit</span>
      </div>

      <JobForm mode="edit" jobId={id} initialData={job} />
    </div>
  );
}

