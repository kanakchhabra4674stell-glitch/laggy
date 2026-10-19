"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  FolderKanban, 
  ExternalLink,
  Presentation,
  Lock,
  Unlock,
  ChevronDown,
  Layers
} from "lucide-react";
import { fetchCourseDetails } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import TranscriptViewer from "@/components/TranscriptViewer";
import TutorChat from "@/components/TutorChat";
import SummaryModal from "@/components/SummaryModal";
import QuizModal from "@/components/QuizModal";
import CompareModal from "@/components/CompareModal";

export default function LearnWorkspacePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(120); // Default starting position (02:00)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Left sidebar tab: 'transcript' | 'resources'
  const [leftTab, setLeftTab] = useState<"transcript" | "resources">("transcript");

  useEffect(() => {
    fetchCourseDetails(courseId)
      .then((data) => {
        setCourse(data);
        if (data.lessons && data.lessons.length > 0) {
          setActiveLesson(data.lessons[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mr-3" />
        <span className="text-sm font-medium">Loading interactive workspace and RAG indices...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-sm max-w-md">
          {error || "Course not found."}
        </div>
        <Link href="/dashboard" className="mt-4 text-xs font-semibold text-indigo-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F19]">
      {/* Top Workspace Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#0D1322] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white tracking-tight">
              {course.title}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-indigo-300 font-medium">
              {activeLesson?.title || "Lesson 1"}
            </span>
          </div>
        </div>

        {/* Timestamp Gate Live Security Indicator */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gate Position: {formatTime(currentTime)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[10px]">Future segments excluded</span>
          </div>
        </div>
      </div>

      {/* 3-Panel Responsive Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Panel: Course Nav, Transcript & Resources (Cols 3) */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 mb-2">
            <button
              onClick={() => setLeftTab("transcript")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
                leftTab === "transcript"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Transcript</span>
            </button>
            <button
              onClick={() => setLeftTab("resources")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
                leftTab === "resources"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Docs ({course.resources?.length || 0})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {leftTab === "transcript" ? (
              <TranscriptViewer
                segments={activeLesson?.transcript_segments || []}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            ) : (
              <div className="flex flex-col h-full bg-[#0D1322] rounded-2xl border border-slate-800/80 p-3 space-y-3 overflow-y-auto">
                <div className="text-xs font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Course Supporting Materials</span>
                  <Link href="/resources" className="text-indigo-400 text-[11px] hover:underline">
                    Manage →
                  </Link>
                </div>
                {course.resources?.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        {r.file_type === "pdf" ? (
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Presentation className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        {r.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="uppercase font-mono">{r.file_type} • {(r.file_size / 1024).toFixed(0)} KB</span>
                      <span className="text-emerald-400 font-medium">Indexed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Video Player & Custom Learning Controls (Cols 5) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto space-y-3">
          <VideoPlayer
            videoUrl={activeLesson?.video_url || "/videos/lecture.mp4"}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onSeek={handleSeek}
            onOpenSummary={() => setIsSummaryOpen(true)}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onOpenCompare={() => setIsCompareOpen(true)}
          />

          {/* Lesson Overview & Notes */}
          <div className="p-4 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module Key Takeaways
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeLesson?.description}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Duration: {formatTime(activeLesson?.duration_seconds || 630)}</span>
              <span className="text-cyan-400">Timeline Pre-filtering Enabled</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Timestamp-Gated AI Tutor Chat (Cols 4) */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <TutorChat
            courseId={course.id}
            lessonId={activeLesson?.id}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </div>
      </div>

      {/* Modals */}
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        courseId={course.id}
        lessonId={activeLesson?.id}
        currentTime={currentTime}
      />

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        courseId={course.id}
        lessonId={activeLesson?.id}
        currentTime={currentTime}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        courseId={course.id}
        lessonId={activeLesson?.id}
        currentTime={currentTime}
      />
    </div>
  );
}
