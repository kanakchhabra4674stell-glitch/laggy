const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load courses");
  return res.json();
}

export async function fetchCourseDetails(courseId: string) {
  const res = await fetch(`${API_BASE}/api/courses/${courseId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load course details");
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dashboard stats");
  return res.json();
}

export async function askQuestion(params: {
  course_id: string;
  lesson_id?: string;
  question: string;
  current_time_seconds?: number;
  session_id?: string;
}) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to ask question");
  }
  return res.json();
}

export async function fetchChatHistory(courseId: string, lessonId?: string, sessionId?: string) {
  const url = new URL(
  `${API_BASE}/api/ask/history`,
  typeof window !== "undefined" ? window.location.origin : "http://localhost"
);
  url.searchParams.set("course_id", courseId);
  if (lessonId) url.searchParams.set("lesson_id", lessonId);
  if (sessionId) url.searchParams.set("session_id", sessionId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function generateSummary(courseId: string, lessonId: string | undefined, currentTimeSeconds: number) {
  const res = await fetch(`${API_BASE}/api/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id: courseId,
      lesson_id: lessonId,
      current_time_seconds: currentTimeSeconds,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate summary");
  return res.json();
}

export async function compareConcepts(
  courseId: string,
  lessonId: string | undefined,
  conceptA: string,
  conceptB: string,
  currentTimeSeconds: number
) {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id: courseId,
      lesson_id: lessonId,
      concept_a: conceptA,
      concept_b: conceptB,
      current_time_seconds: currentTimeSeconds,
    }),
  });
  if (!res.ok) throw new Error("Failed to compare concepts");
  return res.json();
}

export async function generateQuiz(
  courseId: string,
  lessonId: string | undefined,
  currentTimeSeconds: number,
  numQuestions: number = 3
) {
  const res = await fetch(`${API_BASE}/api/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id: courseId,
      lesson_id: lessonId,
      current_time_seconds: currentTimeSeconds,
      num_questions: numQuestions,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate quiz");
  return res.json();
}

export async function submitQuiz(
  courseId: string,
  lessonId: string | undefined,
  timestampContextSeconds: number,
  questionsData: any[],
  userAnswers: Record<string, number>
) {
  const res = await fetch(`${API_BASE}/api/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id: courseId,
      lesson_id: lessonId,
      timestamp_context_seconds: timestampContextSeconds,
      questions_data: questionsData,
      user_answers: userAnswers,
    }),
  });
  if (!res.ok) throw new Error("Failed to submit quiz");
  return res.json();
}

export async function uploadResource(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/resources/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload resource");
  }
  return res.json();
}

export async function fetchResources(courseId?: string) {
  const url = new URL(
    `${API_BASE}/api/resources`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  if (courseId) url.searchParams.set("course_id", courseId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

export async function startInterview(payload: {
  role_target: string;
  interview_type: string;
  difficulty: string;
  total_questions: number;
  course_id?: string;
  resume_text?: string;
  job_description?: string;
}) {
  const res = await fetch(`${API_BASE}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to start interview");
  return res.json();
}

export async function submitInterviewAnswer(sessionId: string, answer: string) {
  const res = await fetch(`${API_BASE}/api/interview/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error("Failed to submit interview answer");
  return res.json();
}

export async function endInterviewEarly(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/interview/${sessionId}/end`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to end interview");
  return res.json();
}

export async function fetchInterviewReport(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/interview/${sessionId}/report`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch interview report");
  return res.json();
}

export async function fetchInterviewSessions() {
  const res = await fetch(`${API_BASE}/api/interview/sessions`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export async function updateSettings(payload: { gemini_api_key?: string; gemini_model?: string }) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}
