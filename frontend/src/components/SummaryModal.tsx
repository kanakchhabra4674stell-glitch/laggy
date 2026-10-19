"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, CheckCircle, Clock, Sparkles } from "lucide-react";
import { generateSummary } from "@/lib/api";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  currentTime: number;
}

export default function SummaryModal({
  isOpen,
  onClose,
  courseId,
  lessonId,
  currentTime,
}: SummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      generateSummary(courseId, lessonId, currentTime)
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, courseId, lessonId, currentTime]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lecture Progression Summary</h2>
              <p className="text-xs text-indigo-300 font-mono">
                Evidence gated strictly through: {formatTime(currentTime)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs">Synthesizing lesson concepts up to {formatTime(currentTime)}...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Summary text */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                {data.summary}
              </div>

              {/* Key Takeaways */}
              {data.key_takeaways && data.key_takeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Core Concepts Mastered:
                  </h4>
                  <ul className="space-y-1.5">
                    {data.key_takeaways.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start text-xs text-slate-300 space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citations */}
              {data.citations && data.citations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Source Evidence:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.citations.map((c: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="font-semibold text-indigo-300 block mb-1">{c.source_name}</span>
                        <p className="text-slate-400 line-clamp-2">"{c.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
