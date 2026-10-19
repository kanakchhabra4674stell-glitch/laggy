"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  Clock, 
  Award, 
  HelpCircle, 
  Briefcase, 
  Upload, 
  ArrowRight, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  FileCheck,
  CheckCircle2
} from "lucide-react";
import { fetchCourses, fetchDashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCourses(), fetchDashboardStats()])
      .then(([c, s]) => {
        setCourses(c);
        setStats(s);
      })
      .catch((err) => console.error("Error loading dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatStudyTime = (secs: number = 0) => {
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-[#0F172A] to-cyan-950/50 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learner Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, Alex Rivera! 👋
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            You're currently enrolled in Machine Learning Fundamentals. Your video context is saved and ready to resume without spoilers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/learn/ml-fundamentals"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Continue Learning</span>
          </Link>

          <Link
            href="/interview"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Start Interview</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Time Studied</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {loading ? "..." : formatStudyTime(stats?.total_time_studied_seconds || 1240)}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Courses Enrolled</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {loading ? "..." : stats?.courses_enrolled || 1}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Latest Quiz Score</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {loading ? "..." : `${stats?.recent_quizzes?.[0]?.score || 100}%`}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Interview Performance</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
              {loading ? "..." : `${stats?.recent_interviews?.[0]?.overall_score || 89.5}/100`}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Courses & Recent Questions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courses */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Active Courses
              </h2>
              <span className="text-xs text-slate-500">{courses.length} Available</span>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                      Machine Learning
                    </span>
                    <h3 className="text-sm font-bold text-white">{course.title}</h3>
                    <p className="text-xs text-slate-400 max-w-xl line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                      <span>Instructor: {course.instructor}</span>
                      <span>•</span>
                      <span>{course.lesson_count} Lessons</span>
                      <span>•</span>
                      <span>{course.resource_count} Supporting Docs</span>
                    </div>
                  </div>

                  <Link
                    href={`/learn/${course.id}`}
                    className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Doubt Questions */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Recent Questions & Doubt Solving
            </h2>

            {stats?.recent_questions && stats.recent_questions.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recent_questions.map((q: any) => (
                  <div key={q.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-200">"{q.question}"</span>
                    {q.timestamp_context && (
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                        {Math.floor(q.timestamp_context / 60)}:{(q.timestamp_context % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No questions asked yet. Jump into the workspace to ask your first doubt!</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Quizzes & Interview History */}
        <div className="space-y-6">
          {/* Recent Quiz Scores */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Recent Quizzes
            </h2>

            {stats?.recent_quizzes && stats.recent_quizzes.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_quizzes.map((quiz: any) => (
                  <div key={quiz.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Concept Check</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {quiz.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No quiz attempts yet.</p>
            )}
          </div>

          {/* Interview History */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Mock Interview Practice
            </h2>

            {stats?.recent_interviews && stats.recent_interviews.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_interviews.map((iv: any) => (
                  <Link
                    key={iv.id}
                    href={`/interview/${iv.id}/report`}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 block transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{iv.role_target}</span>
                      <span className="text-xs font-mono font-bold text-purple-400">
                        {iv.overall_score ? `${iv.overall_score}/100` : "In Progress"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="capitalize">{iv.interview_type} • {iv.difficulty}</span>
                      <span className="text-indigo-400">View Report →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No interview sessions completed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
