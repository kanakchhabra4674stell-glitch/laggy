"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  Send, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Award, 
  HelpCircle,
  CheckCircle2,
  Clock,
  LogOut
} from "lucide-react";
import { submitInterviewAnswer, endInterviewEarly } from "@/lib/api";

export default function LiveInterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpReason, setFollowUpReason] = useState<string | null>(null);

  const [answerInput, setAnswerInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evalNotes, setEvalNotes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch using report or initial QA
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/interview/sessions`)
      .then((res) => res.json())
      .then((sessions) => {
        const current = sessions.find((s: any) => s.id === sessionId);
        if (current) {
          setTotalQuestions(current.total_questions || 5);
        }
      })
      .catch(() => {});

    // Fetch active session QA
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/interview/${sessionId}/report`)
      .then((res) => {
        if (res.ok) {
          // Already completed
          router.push(`/interview/${sessionId}/report`);
        }
      })
      .catch(() => {});
  }, [sessionId, router]);

  // Set default question if not set
  useEffect(() => {
    if (!currentQuestion) {
      setCurrentQuestion(
        "Welcome to your interview. Let's start with your architectural philosophy: How do you design and optimize retrieval-augmented generation pipelines to prevent latency degradation and concept hallucination in production?"
      );
    }
  }, [currentQuestion]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setEvalNotes(null);

    try {
      const resp = await submitInterviewAnswer(sessionId, answerInput);

      if (resp.completed) {
        router.push(`/interview/${sessionId}/report`);
        return;
      }

      setQuestionIndex(resp.current_question_index);
      setTotalQuestions(resp.total_questions);
      setCurrentQuestion(resp.question);
      setIsFollowUp(resp.is_follow_up);
      setFollowUpReason(resp.follow_up_reason || null);
      setEvalNotes(resp.evaluation_of_previous);
      setAnswerInput("");
    } catch (err: any) {
      setError(err.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndEarly = async () => {
    if (confirm("Conclude this interview now and generate your evaluation scorecard?")) {
      try {
        await endInterviewEarly(sessionId);
        router.push(`/interview/${sessionId}/report`);
      } catch (err: any) {
        setError(err.message || "Failed to end interview.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0D1322] border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Live Mock Interview
            </span>
            <span className="text-[11px] font-mono text-purple-300">
              Question {questionIndex} of {totalQuestions}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleEndEarly}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Finish Early & Get Scorecard</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Adaptive Follow-up alert if triggered */}
      {isFollowUp && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 text-indigo-200 text-xs flex items-start space-x-2.5 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Adaptive Follow-Up Triggered:</span>{" "}
            {followUpReason || "The interviewer is probing deeper into your previous technical approach."}
          </div>
        </div>
      )}

      {/* Previous Answer Evaluation Flash */}
      {evalNotes && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Previous Response Evaluated — Score: {evalNotes.score}/100
          </div>
          <p className="text-slate-300">{evalNotes.notes}</p>
        </div>
      )}

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1322] border border-slate-800 shadow-2xl space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
            {isFollowUp ? "Adaptive Clarification" : `Competency Assessment • Question ${questionIndex}`}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            "{currentQuestion}"
          </h2>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Answer:
            </label>
            <textarea
              rows={6}
              required
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Structure your answer clearly. Explain your technical approach, underlying trade-offs, and verification strategies..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{answerInput.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span>Tip: Detail real-world operational trade-offs for higher scoring</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !answerInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xl shadow-purple-600/30 flex items-center space-x-2 transition-all hover:scale-[1.01]"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer & Formulating Next Question...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
