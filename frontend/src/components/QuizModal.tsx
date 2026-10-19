"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, HelpCircle, Sparkles, Award } from "lucide-react";
import { generateQuiz, submitQuiz } from "@/lib/api";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  currentTime: number;
}

export default function QuizModal({
  isOpen,
  onClose,
  courseId,
  lessonId,
  currentTime,
}: QuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setResult(null);
      setUserAnswers({});
      generateQuiz(courseId, lessonId, currentTime, 3)
        .then(setQuizData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, courseId, lessonId, currentTime]);

  if (!isOpen) return null;

  const handleSelect = (questionId: string, optionIdx: number) => {
    if (result) return; // Prevent change after submit
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = async () => {
    if (!quizData || !quizData.questions) return;
    setSubmitting(true);
    try {
      const evalResult = await submitQuiz(
        courseId,
        lessonId,
        currentTime,
        quizData.questions,
        userAnswers
      );
      setResult(evalResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Interactive Concept Quiz</h2>
              <p className="text-xs text-cyan-300 font-mono">
                Generated strictly from material covered up to this timestamp
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs">Generating multiple-choice questions from covered content...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Results Score Banner */}
          {result && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 to-cyan-950 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Quiz Evaluation Completed</h4>
                  <p className="text-xs text-cyan-300">
                    You scored {result.score} of {result.total_questions} ({result.percentage}%)
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {result.percentage}%
              </div>
            </div>
          )}

          {/* Questions */}
          {!loading && quizData?.questions && (
            <div className="space-y-6">
              {quizData.questions.map((q: any, qIdx: number) => {
                const userChoice = userAnswers[q.id];
                const evalItem = result?.evaluations?.find((e: any) => e.question_id === q.id);

                return (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-white leading-relaxed">
                        <span className="text-indigo-400 mr-2">Q{qIdx + 1}.</span>
                        {q.question}
                      </h4>
                      {evalItem && (
                        evalItem.is_correct ? (
                          <span className="flex items-center text-emerald-400 text-xs font-semibold shrink-0">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center text-red-400 text-xs font-semibold shrink-0">
                            <XCircle className="w-4 h-4 mr-1" /> Incorrect
                          </span>
                        )
                      )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = userChoice === optIdx;
                        let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                        if (result) {
                          if (optIdx === q.correct_index) {
                            btnStyle = "bg-emerald-950/60 border-emerald-500/70 text-emerald-200 font-semibold";
                          } else if (isSelected && !evalItem?.is_correct) {
                            btnStyle = "bg-red-950/60 border-red-500/70 text-red-200";
                          }
                        } else if (isSelected) {
                          btnStyle = "bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold";
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelect(q.id, optIdx)}
                            disabled={!!result}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] shrink-0 ml-2">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {evalItem && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 mt-2 space-y-1">
                        <span className="font-semibold text-indigo-400 block">Explanation & Grounding:</span>
                        <p className="text-slate-400">{evalItem.explanation}</p>
                        {evalItem.citation && (
                          <div className="text-[10px] text-cyan-400 font-mono pt-1">
                            Source: {evalItem.citation.source_name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {Object.keys(userAnswers).length} of {quizData?.questions?.length || 0} answered
          </span>

          <div className="flex items-center space-x-2">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(userAnswers).length === 0}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-md shadow-cyan-600/30"
              >
                {submitting ? "Scoring..." : "Submit Answers"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
