import React from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen
} from "lucide-react";

export default function LandingPage() {
  const journeySteps = [
    { name: "WATCH", desc: "Interactive video lecture" },
    { name: "PAUSE", desc: "Lock current timestamp" },
    { name: "ASK", desc: "Instant AI doubt solving" },
    { name: "UNDERSTAND", desc: "Strictly spoiler-safe answers" },
    { name: "PRACTICE", desc: "Quizzes from covered content" },
    { name: "REVISE", desc: "Summaries & comparisons" },
    { name: "INTERVIEW", desc: "Adaptive mock job interview" },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-xs font-medium text-cyan-300 mb-8 shadow-inner shadow-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AHGV BuildVerse 2026 Hackathon Special</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Learn in Flow. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
            Ask Without Spoilers.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The first timestamp-aware educational platform. Pause at <span className="text-cyan-300 font-mono font-semibold">03:00</span>, and our tutor strictly grounds answers in what has been taught so far—preventing future spoilers with citation-backed precision.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/learn/ml-fundamentals"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Demo Course</span>
          </Link>

          <Link
            href="/interview"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Try AI Mock Interview</span>
          </Link>
        </div>

        {/* The 7-Step Journey */}
        <div className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
            The PauseAI Mastery Journey
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {journeySteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center group hover:border-indigo-500/40 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700/50 text-[11px] font-mono font-bold text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="text-xs font-bold text-white tracking-wide">{step.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase: The Timestamp Gate in Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#0B0F19] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Core Architectural Breakthrough
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
              Server-Enforced Timestamp Authorization Gate
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Unlike generic chatbots that leak entire transcript spoilers into their context, PauseAI enforces an immutable pre-filtering rule:
              <br />
              <code className="text-cyan-300 font-mono text-xs bg-slate-950/80 px-2 py-1 rounded border border-slate-800 inline-block mt-2">
                segment.end_time_seconds &lt;= current_time_seconds
              </code>
            </p>
          </div>

          {/* Interactive Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Ordinary Chatbot */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-red-900/40 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Ordinary Chatbot (Future Leakage)</span>
              </div>
              <div className="text-xs text-slate-400">
                Student at <span className="font-mono text-white">03:00</span> asks: "What is backpropagation?"
              </div>
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-200">
                "Backpropagation calculates partial derivatives of the loss with respect to weights using the chain rule..."
                <span className="block mt-2 text-[10px] text-red-400 font-semibold">
                  ❌ Spoils lecture content scheduled for 06:00! Overwhelms the student.
                </span>
              </div>
            </div>

            {/* PauseAI */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-cyan-500/40 space-y-3 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>PauseAI (Timestamp Gate Guarded)</span>
              </div>
              <div className="text-xs text-slate-400">
                Student at <span className="font-mono text-white">03:00</span> asks: "What is backpropagation?"
              </div>
              <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700/50 text-xs text-indigo-200">
                "This concept appears later in the lesson (around 06:00) and has not yet been covered in your playback context. We keep this gated to avoid spoiling the explanation!"
                <span className="block mt-2 text-[10px] text-cyan-300 font-semibold">
                  ✅ Zero future leakage. Verifiable citation grounding.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triple Pillar Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Video Learning Workspace</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seamless 3-panel workspace pairing an HTML5 video player with interactive clickable transcripts and our citation-backed AI assistant.
              </p>
            </div>
            <Link
              href="/learn/ml-fundamentals"
              className="mt-6 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Explore workspace</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multimodal Ingestion RAG</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Genuine hybrid retrieval (BM25 + Dense Vectors + RRF) over VTT transcripts, PyMuPDF parsed documents, PowerPoint slides, and notes.
              </p>
            </div>
            <Link
              href="/resources"
              className="mt-6 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View resources</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Adaptive Mock Interview</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dynamic follow-up interview state machine analyzing candidate answers across Technical, Communication, and Problem Solving rubrics.
              </p>
            </div>
            <Link
              href="/interview"
              className="mt-6 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Start an interview</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-8 text-center text-xs text-slate-500">
        <p>PauseAI — AHGV BuildVerse 2026 Hackathon Finalist Project</p>
        <p className="mt-1 text-[11px] text-slate-600">Built with Next.js, FastAPI, SentenceTransformers, PyMuPDF, python-pptx & Gemini API</p>
      </footer>
    </div>
  );
}
