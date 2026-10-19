"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  Scale,
  ShieldAlert,
  Lock
} from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  onOpenSummary: () => void;
  onOpenQuiz: () => void;
  onOpenCompare: () => void;
}

export default function VideoPlayer({
  videoUrl,
  currentTime,
  onTimeUpdate,
  onSeek,
  onOpenSummary,
  onOpenQuiz,
  onOpenCompare,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(630); // Default 10:30 min
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [bufferedTime, setBufferedTime] = useState(0);

  // Sync seek requests from outside (transcript click, citation click)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1.0) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    onTimeUpdate(curr);

    if (videoRef.current.buffered.length > 0) {
      setBufferedTime(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 630);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
    onSeek(target);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black group flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          playsInline
        />

        {/* Overlay Play/Pause animation when paused */}
        {!isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-500/40 hover:scale-110 transition-transform">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Timestamp Gate Live Indicator Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-indigo-500/30 text-xs">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-mono text-cyan-300 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-slate-400">/ {formatTime(duration)}</span>
          <div className="h-3 w-[1px] bg-slate-700 mx-1"></div>
          <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" />
            RAG Gate Active
          </span>
        </div>

        {/* Custom Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-95 transition-opacity">
          {/* Progress / Seek bar */}
          <div className="relative w-full mb-3 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-slate-300">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-white transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => {
                  const newT = Math.max(0, currentTime - 10);
                  if (videoRef.current) videoRef.current.currentTime = newT;
                  onSeek(newT);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const newT = Math.min(duration, currentTime + 10);
                  if (videoRef.current) videoRef.current.currentTime = newT;
                  onSeek(newT);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="text-xs font-mono font-medium text-slate-200">
                {formatTime(currentTime)} <span className="text-slate-500">/</span> {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Playback speed selector */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-[11px] font-mono">
                {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-1.5 py-0.5 rounded ${
                      playbackRate === speed
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Tools Action Bar */}
      <div className="px-5 py-3.5 bg-[#0D1322] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Learning Actions:</span>
          <span className="text-xs text-indigo-400 font-mono">Position: {formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 text-xs font-medium transition-all hover:scale-[1.02]"
            title="Generate summary of content covered up to this timestamp"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Summarize to Here</span>
          </button>

          <button
            onClick={onOpenQuiz}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/40 text-xs font-medium transition-all hover:scale-[1.02]"
            title="Generate quiz on material covered up to this timestamp"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quiz on Covered</span>
          </button>

          <button
            onClick={onOpenCompare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-700/40 text-xs font-medium transition-all hover:scale-[1.02]"
            title="Compare two concepts using only covered material"
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Compare Concepts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
