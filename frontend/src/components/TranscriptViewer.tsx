"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Lock, Unlock, Play, FileText, CheckCircle } from "lucide-react";

interface TranscriptSegment {
  id: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function TranscriptViewer({
  segments,
  currentTime,
  onSeek,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  const filteredSegments = segments.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1322] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Interactive Transcript</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {segments.length} segments
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search transcript concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No matching transcript segments found.
          </div>
        ) : (
          filteredSegments.map((seg) => {
            const isUnlocked = seg.end_seconds <= currentTime;
            const isCurrentlyPlaying =
              currentTime >= seg.start_seconds && currentTime <= seg.end_seconds;

            return (
              <div
                key={seg.id}
                ref={isCurrentlyPlaying ? activeSegmentRef : null}
                onClick={() => onSeek(seg.start_seconds)}
                className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isCurrentlyPlaying
                    ? "bg-indigo-950/70 border-cyan-500/60 shadow-md shadow-cyan-500/10"
                    : isUnlocked
                    ? "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    : "bg-slate-950/40 border-slate-900/60 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isCurrentlyPlaying
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : isUnlocked
                          ? "bg-slate-800 text-indigo-300"
                          : "bg-slate-900 text-slate-500"
                      }`}
                    >
                      {formatTime(seg.start_seconds)} - {formatTime(seg.end_seconds)}
                    </span>

                    {isCurrentlyPlaying && (
                      <span className="flex items-center text-[10px] text-cyan-400 font-medium animate-pulse">
                        <Play className="w-2.5 h-2.5 mr-1 fill-cyan-400" /> Playing
                      </span>
                    )}
                  </div>

                  {/* Gate Status Indicator */}
                  {isUnlocked ? (
                    <span className="flex items-center text-[10px] text-emerald-400 font-medium">
                      <Unlock className="w-3 h-3 mr-1" /> Permitted
                    </span>
                  ) : (
                    <span className="flex items-center text-[10px] text-amber-500/80 font-medium">
                      <Lock className="w-3 h-3 mr-1" /> Unlocks at {formatTime(seg.start_seconds)}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isCurrentlyPlaying
                      ? "text-white font-medium"
                      : isUnlocked
                      ? "text-slate-300 group-hover:text-slate-100"
                      : "text-slate-500"
                  }`}
                >
                  {seg.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
