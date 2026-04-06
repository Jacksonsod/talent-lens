"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setParsedPreview } from "@/lib/slices/applicantsSlice";
import { ParsedApplicantRow } from "@/lib/types";
import toast from "react-hot-toast";

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const { parsedPreview } = useAppSelector((s) => s.applicants);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);

      if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const rows = result.data as ParsedApplicantRow[];
            dispatch(setParsedPreview(rows.slice(0, 20)));
            toast.success(`${rows.length} candidates parsed from CSV`);
          },
          error: () => toast.error("Failed to parse CSV"),
        });
      } else {
        toast.success(`${file.name} uploaded — PDF parsing triggered`);
        dispatch(
          setParsedPreview([
            {
              name: "Parsed from PDF",
              email: "–",
              currentRole: "–",
              yearsOfExperience: "–",
              skills: "Extracting...",
            },
          ])
        );
      }
    },
    [dispatch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  return (
    <div>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center p-14 rounded-2xl cursor-pointer transition-all mb-6 text-center"
        style={{
          border: `1.5px dashed ${isDragActive ? "#7c6fff" : "rgba(255,255,255,0.12)"}`,
          background: isDragActive ? "rgba(124,111,255,0.07)" : "var(--surface)",
        }}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📁</div>
        <div
          className="font-display font-bold text-base mb-1.5"
          style={{ color: "#f0f0f5" }}
        >
          {isDragActive ? "Drop files here" : "Drop your CSV, Excel or PDF resumes"}
        </div>
        <div className="text-sm" style={{ color: "#5a5a72" }}>
          Supports .csv · .xlsx · .pdf · Up to 200 files
        </div>
      </div>

      {/* Preview table */}
      {parsedPreview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "#5a5a72" }}
            >
              Preview — {parsedPreview.length} candidates parsed from {fileName}
            </div>
            <button
              className="px-4 py-2 rounded-lg text-[12px] font-medium border"
              style={{
                background: "rgba(0,229,160,0.1)",
                borderColor: "rgba(0,229,160,0.2)",
                color: "#00e5a0",
              }}
            >
              ▶ Screen These Candidates
            </button>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface2)" }}>
                  {["#", "Name", "Current Role", "Experience", "Skills", "Source"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-bold tracking-widest uppercase"
                        style={{
                          color: "#5a5a72",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {parsedPreview.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="transition-colors hover:bg-[var(--surface2)]"
                  >
                    <td className="px-4 py-3" style={{ color: "#5a5a72" }}>
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#f0f0f5" }}>
                      {row.name || "–"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9090a8" }}>
                      {row.currentRole || "–"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9090a8" }}>
                      {row.yearsOfExperience
                        ? `${row.yearsOfExperience} yrs`
                        : "–"}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "#9090a8" }}>
                      {row.skills || "–"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#5a5a72" }}>
                      {fileName?.endsWith(".csv") ? "CSV upload" : "PDF resume"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
