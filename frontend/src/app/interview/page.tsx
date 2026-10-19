"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Sliders,
  History,
  Award
} from "lucide-react";
import { startInterview, fetchInterviewSessions, fetchCourses } from "@/lib/api";

export default function InterviewSetupPage() {
  const router = useRouter();

  const [roleTarget, setRoleTarget] = useState("Machine Learning Engineer");
  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [courseId, setCourseId] = useState("ml-fundamentals");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchCourses(), fetchInterviewSessions()])
      .then(([c, s]) => {
        setCourses(c);
        setPastSessions(s);
      })
      .catch((err) => console.error("Error loading interview setup:", err));
  }, []);

  const loadDemoData = () => {
    setRoleTarget("Senior Machine Learning Engineer");
    setResumeText(`ALEX RIVERA
Machine Learning Engineer | M.S. Computer Science
Experienced in PyTorch, hybrid RAG retrieval pipelines, Reciprocal Rank Fusion, FastAPI microservices, and distributed model training. Built latency-optimized vector search caching and automated backpropagation gradient profilers.`);
    setJobDescription(`We are seeking a Senior Machine Learning Engineer to design and deploy resilient RAG architectures, architect hybrid sparse/dense retrieval pipelines, and optimize LLM inference microservices. Requires deep mastery of neural networks, gradient dynamics, and distributed systems.`);
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    setError(null);

    try {
      const resp = await startInterview({
        role_target: roleTarget,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: totalQuestions,
        course_id: courseId || undefined,
        resume_text: resumeText || undefined,
        job_description: jobDescription || undefined,
      });

      router.push(`/interview/${resp.session_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start interview session.");
      setStarting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Mock Interview Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Setup Your Adaptive Mock Interview
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Simulate a real-world interview with an AI interviewer that analyzes your answers across 4 evaluation rubrics and asks intelligent adaptive follow-up questions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDemoData}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-xs font-semibold flex items-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Demo Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (Cols 2) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#0D1322] border border-slate-800 shadow-xl space-y-6">
          <form onSubmit={handleStart} className="space-y-5 text-xs">
            {/* Target Role & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Target Job Title / Role
                </label>
                <input
                  type="text"
                  required
                  value={roleTarget}
                  onChange={(e) => setRoleTarget(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Course Material Grounding (Optional)
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">None (General Industry)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type, Difficulty, Questions Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 capitalize"
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="hr">HR / Culture</option>
                  <option value="mixed">Mixed (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 capitalize"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Question Count
                </label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={3}>3 Questions (Quick Drill)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Deep Dive)</option>
                </select>
              </div>
            </div>

            {/* Resume Text */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Resume Highlights / Candidate Profile</span>
                <span className="text-[10px] text-slate-500 font-normal">Helps tailor question relevance</span>
              </label>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key experience, tech stack, or summary from your resume..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Target Job Description
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste core responsibilities or requirements from the target role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
            >
              {starting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Interview Context & First Question...</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  <span>Begin Adaptive Mock Interview</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Past Scorecards & Rubric Explanation */}
        <div className="space-y-6">
          {/* Rubrics Card */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Evaluation Rubrics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every answer is objectively evaluated across 4 core competencies:
            </p>
            <div className="space-y-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="font-semibold text-slate-200">Technical Knowledge</span>
                <span className="text-purple-400 font-mono">35%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="font-semibold text-slate-200">Communication & Clarity</span>
                <span className="text-purple-400 font-mono">25%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="font-semibold text-slate-200">Problem Solving</span>
                <span className="text-purple-400 font-mono">25%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="font-semibold text-slate-200">Structure & Relevance</span>
                <span className="text-purple-400 font-mono">15%</span>
              </div>
            </div>
          </div>

          {/* Past Sessions */}
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Past Interviews
            </h3>

            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-500">No previous sessions found.</p>
            ) : (
              <div className="space-y-2.5">
                {pastSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/interview/${s.id}/report`}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 block transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-purple-300">
                        {s.role_target}
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-400">
                        {s.overall_score ? `${s.overall_score}/100` : "Active"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span className="capitalize">{s.interview_type} • {s.difficulty}</span>
                      <span className="text-indigo-400">View Report →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
