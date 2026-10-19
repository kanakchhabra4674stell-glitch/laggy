"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Lock, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle, 
  HelpCircle,
  Clock,
  Layers,
  FileText,
  Presentation
} from "lucide-react";
import { askQuestion } from "@/lib/api";

interface Citation {
  source_type: string;
  source_name: string;
  start_seconds?: number;
  end_seconds?: number;
  page_number?: number;
  slide_number?: number;
  excerpt: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: Citation[];
  confidence?: string;
  abstained?: boolean;
  spoiler_prevented?: boolean;
  context_time?: number;
}

interface TutorChatProps {
  courseId: string;
  lessonId: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function TutorChat({
  courseId,
  lessonId,
  currentTime,
  onSeek,
}: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am your PauseAI grounded tutor. Ask me any question about the lecture or supporting resources. I strictly reference only what has been covered up to your current playback timestamp.",
      confidence: "high",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      context_time: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput("");
    setLoading(true);

    try {
      const resp = await askQuestion({
        course_id: courseId,
        lesson_id: lessonId,
        question: textToSend,
        current_time_seconds: currentTime,
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: resp.answer,
        citations: resp.citations,
        confidence: resp.confidence,
        abstained: resp.abstained,
        spoiler_prevented: resp.spoiler_prevented,
        context_time: resp.context_timestamp_seconds,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "assistant",
          text: `Error connecting to tutor: ${err.message || "Failed to process question."}`,
          confidence: "none",
          abstained: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs?: number) => {
    if (secs === undefined || secs === null) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const suggestedQuestions = [
    "What is an artificial neuron?",
    "Explain this concept with an analogy",
    "Which activation function overcomes vanishing gradients?",
    "How does backpropagation work?", // Spoiler test
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D1322] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">PauseAI Tutor</h3>
            <p className="text-[10px] text-slate-400">Strict Timestamp Grounded</p>
          </div>
        </div>

        {/* Current Context Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-indigo-500/30 text-[11px] font-mono text-cyan-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Locked: {formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                    : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-md"
                }`}
              >
                {/* Header label for assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> PauseAI Tutor
                    </span>
                    {msg.context_time !== undefined && (
                      <span className="font-mono text-slate-500">
                        Context: {formatTime(msg.context_time)}
                      </span>
                    )}
                  </div>
                )}

                {/* Spoiler prevention banner */}
                {msg.spoiler_prevented && (
                  <div className="mb-2 p-2 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-200 text-[11px] flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Future Concept Gate:</span> This concept appears later in the lecture. We hide spoilers so you can master the foundations first!
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Citations List */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Verified Citations
                    </div>
                    {msg.citations.map((cit, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-cyan-300 flex items-center gap-1">
                            {cit.source_type === "video" || cit.source_type === "video_transcript" ? (
                              <Clock className="w-3 h-3 text-indigo-400" />
                            ) : cit.source_type === "pdf" ? (
                              <FileText className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Presentation className="w-3 h-3 text-purple-400" />
                            )}
                            {cit.source_name}
                          </span>

                          {/* Seek Video Button if timestamped */}
                          {cit.start_seconds !== undefined && cit.start_seconds !== null && (
                            <button
                              onClick={() => onSeek(cit.start_seconds!)}
                              className="px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono border border-indigo-700/50 flex items-center gap-1 transition-colors"
                            >
                              <span>Seek {formatTime(cit.start_seconds)}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}

                          {cit.page_number && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/50">
                              Page {cit.page_number}
                            </span>
                          )}

                          {cit.slide_number && (
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/50">
                              Slide {cit.slide_number}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 italic text-[10px] line-clamp-2">
                          "{cit.excerpt}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start">
            <div className="bg-slate-900 rounded-2xl rounded-bl-none border border-slate-800 p-3 flex items-center space-x-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Verifying timestamp permissions & retrieving evidence...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition-all whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder={`Ask anything covered up to ${formatTime(currentTime)}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-indigo-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
