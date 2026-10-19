"use client";

import React, { useState } from "react";
import { X, Scale, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { compareConcepts } from "@/lib/api";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  currentTime: number;
}

export default function CompareModal({
  isOpen,
  onClose,
  courseId,
  lessonId,
  currentTime,
}: CompareModalProps) {
  const [conceptA, setConceptA] = useState("Artificial Neuron");
  const [conceptB, setConceptB] = useState("Loss Function");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCompare = async () => {
    if (!conceptA.trim() || !conceptB.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareConcepts(courseId, lessonId, conceptA, conceptB, currentTime);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to compare concepts.");
    } finally {
      setLoading(false);
    }
  };

  const samplePairs = [
    ["Artificial Neuron", "Loss Function"],
    ["MSE", "Cross-Entropy"],
    ["Gradient Descent", "Backpropagation"], // Backpropagation tests the future spoiler detection!
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Scale className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Concept Comparison</h2>
              <p className="text-xs text-purple-300 font-mono">
                Evaluates two concepts using permitted knowledge up to current time
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                First Concept
              </label>
              <input
                type="text"
                value={conceptA}
                onChange={(e) => setConceptA(e.target.value)}
                placeholder="e.g. Artificial Neuron"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Second Concept
              </label>
              <input
                type="text"
                value={conceptB}
                onChange={(e) => setConceptB(e.target.value)}
                placeholder="e.g. Loss Function"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Quick preset pairs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">Try quick pairs:</span>
            {samplePairs.map(([a, b], idx) => (
              <button
                key={idx}
                onClick={() => {
                  setConceptA(a);
                  setConceptB(b);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 transition-colors"
              >
                {a} vs {b}
              </button>
            ))}
          </div>

          <button
            onClick={handleCompare}
            disabled={loading || !conceptA.trim() || !conceptB.trim()}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-purple-600/30"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-purple-300" />
                <span>Checking coverage and retrieving comparative evidence...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                <span>Compare Under Current Position Gate</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-2">
              {/* Coverage badges */}
              <div className="flex items-center space-x-3 text-xs">
                <span
                  className={`px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                    result.concept_a_covered
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {result.concept_a_covered ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {conceptA}: {result.concept_a_covered ? "Covered" : "Not yet introduced"}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                    result.concept_b_covered
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {result.concept_b_covered ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {conceptB}: {result.concept_b_covered ? "Covered" : "Not yet introduced"}
                </span>
              </div>

              {/* Comparison output */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {result.comparison}
              </div>

              {/* Citations */}
              {result.citations && result.citations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Supporting Citations:
                  </h4>
                  <div className="space-y-2">
                    {result.citations.map((c: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="font-semibold text-purple-300 block mb-1">
                          {c.concept} — {c.source_name}
                        </span>
                        <p className="text-slate-400">"{c.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
