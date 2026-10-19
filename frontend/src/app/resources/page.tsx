"use client";

import React, { useEffect, useState } from "react";
import { 
  FolderKanban, 
  Upload, 
  FileText, 
  Presentation, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Plus
} from "lucide-react";
import { fetchResources, uploadResource, fetchCourses } from "@/lib/api";

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ml-fundamentals");
  const [unlockTime, setUnlockTime] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchResources(), fetchCourses()])
      .then(([resList, courseList]) => {
        setResources(resList);
        setCourses(courseList);
      })
      .catch((err) => console.error("Error loading resources:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus("Uploading file & extracting text...");
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("course_id", selectedCourse);
    if (title.trim()) formData.append("title", title.trim());
    if (unlockTime) {
      formData.append("unlock_timestamp_seconds", unlockTime);
    }

    try {
      const resp = await uploadResource(formData);
      setUploadStatus(`Success! Ingested and indexed ${resp.chunks_created} knowledge chunks.`);
      setSelectedFile(null);
      setTitle("");
      setUnlockTime("");
      loadData();
    } catch (err: any) {
      setUploadError(err.message || "Failed to process resource.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Multimodal Knowledge Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Learning Resources & Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Ingest PDFs, PowerPoint presentations, transcripts, and notes. Chunks are automatically embedded and bound to our server-enforced timestamp gate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Form */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-5 h-fit shadow-xl">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Upload New Material</h2>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {/* File input */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Select File (PDF, PPTX, VTT, SRT, DOCX, TXT)
              </label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
                accept=".pdf,.pptx,.ppt,.vtt,.srt,.docx,.txt,.md"
                required
                className="w-full text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 file:cursor-pointer cursor-pointer border border-slate-800 rounded-xl p-2 bg-slate-950"
              />
            </div>

            {/* Custom Title */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Resource Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Neural Networks Study Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Course */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Target Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Timeline Lock */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Timeline Unlock Seconds (Optional)</span>
                <span className="text-[10px] text-slate-500 font-normal">Leave blank for unrestricted</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 360 (unlocks at 06:00)"
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {uploadStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/30"
            >
              {isUploading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Ingest Knowledge Asset</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Ingested Knowledge Assets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              Indexed Course Assets ({resources.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">BM25 + Dense Vectors</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#0D1322] rounded-2xl border border-slate-800">
              No supporting documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {res.file_type === "pdf" ? (
                        <FileText className="w-5 h-5 text-emerald-400" />
                      ) : res.file_type === "pptx" ? (
                        <Presentation className="w-5 h-5 text-purple-400" />
                      ) : (
                        <FolderKanban className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">{res.title}</h3>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                        <span className="uppercase text-cyan-400">{res.file_type}</span>
                        <span>•</span>
                        <span>{(res.file_size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-indigo-300 font-semibold">{res.chunk_count} Knowledge Chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Timestamp Gating Badge */}
                    {res.unlock_timestamp_seconds !== null && res.unlock_timestamp_seconds !== undefined ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-600/30 text-amber-300 text-[10px] font-mono">
                        <Lock className="w-3 h-3 text-amber-400" />
                        Unlocks at {res.unlock_timestamp_seconds}s
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        Unrestricted
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
