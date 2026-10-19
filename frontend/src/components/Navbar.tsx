"use client";

import React, { useEffect, useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { 
  PlayCircle, 
  LayoutDashboard, 
  BookOpen, 
  FolderKanban, 
  Briefcase, 
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { fetchHealth } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learn/ml-fundamentals", label: "Learn", icon: BookOpen },
    { href: "/resources", label: "Resources", icon: FolderKanban },
    { href: "/interview", label: "AI Interview", icon: Briefcase },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1F293D] bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <a href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-[#0B0F19] rounded-xl flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white">Pause</span>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </div>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">Timestamp-Gated RAG</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right Status & User */}
        <div className="flex items-center space-x-4">
          {/* AI Provider Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === "healthy" ? "bg-emerald-400" : "bg-amber-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                health?.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"
              }`}></span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {health?.ai_provider?.gemini_active ? "Gemini 2.5 Flash" : "Local RAG Engine"}
            </span>
          </div>

          {/* Demo User Avatar */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white shadow-inner">
              AR
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200">Alex Rivera</span>
              <span className="text-[10px] text-slate-500">Learner Demo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
