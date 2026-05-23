"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JOB_ROLES } from "@/lib/constants";

type Step = "upload" | "configure" | "analyzing";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResumeId(data.resumeId);
      setStep("configure");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeId || !selectedRole) return;
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobRole: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      router.push(`/results/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("configure");
    }
  };

  const steps: Step[] = ["upload", "configure", "analyzing"];
  const stepLabels = { upload: "Upload", configure: "Configure", analyzing: "Analyzing" };
  const currentStepIdx = steps.indexOf(step);

  return (
    <main className="min-h-screen bg-[#0b0f1a] flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">ResumeAI</span>
          </div>
          <span className="text-xs text-slate-500">Powered by Claude Sonnet 4.6</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI-Powered Analysis
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Optimize Your Resume with AI
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload your resume and get instant ATS scores, skill gap analysis,
              and role-specific recommendations powered by Claude.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s ? "bg-indigo-600 text-white" : i < currentStepIdx ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"
                }`}>
                  {i < currentStepIdx ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === s ? "text-slate-200" : "text-slate-500"}`}>
                  {stepLabels[s]}
                </span>
                {i < 2 && <div className="w-8 h-px bg-slate-700" />}
              </div>
            ))}
          </div>

          {step === "upload" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? "border-indigo-500 bg-indigo-500/5" : file ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-300 font-medium">Drop your resume here</p>
                      <p className="text-xs text-slate-500 mt-0.5">or click to browse</p>
                    </div>
                    <p className="text-xs text-slate-600">PDF or DOCX • Max 10MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button onClick={handleUpload} disabled={!file || uploading} className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Extracting text...
                  </span>
                ) : "Upload Resume"}
              </button>
            </div>
          )}

          {step === "configure" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-xs text-emerald-400 font-medium">Resume uploaded successfully</p>
              </div>
              <h2 className="text-base font-semibold text-white mb-5">Select your target job role</h2>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {JOB_ROLES.map((role) => (
                  <button key={role} onClick={() => setSelectedRole(role)} className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                    selectedRole === role ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}>
                    {role}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button onClick={handleAnalyze} disabled={!selectedRole} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                Analyze with AI
              </button>

              <button onClick={() => { setStep("upload"); setFile(null); setResumeId(null); }} className="mt-2 w-full py-2 text-xs text-slate-500 hover:text-slate-400 transition-colors">
                ← Upload a different resume
              </button>
            </div>
          )}

          {step === "analyzing" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white mb-2">Analyzing your resume</h2>
              <p className="text-sm text-slate-400">
                Claude is reviewing your resume for{" "}
                <span className="text-indigo-300 font-medium">{selectedRole}</span>...
              </p>
              <p className="text-xs text-slate-600 mt-3">This usually takes 10–20 seconds</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
