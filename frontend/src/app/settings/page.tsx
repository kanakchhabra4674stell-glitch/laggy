"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Key, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { fetchSettings, updateSettings, fetchHealth } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([fetchSettings(), fetchHealth()])
      .then(([s, h]) => {
        setSettings(s);
        setHealth(h);
        if (s.gemini_model) setGeminiModel(s.gemini_model);
      })
      .catch((err) => console.error("Error loading settings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const resp = await updateSettings({
        gemini_api_key: geminiKey || undefined,
        gemini_model: geminiModel,
      });
      setMessage("Configuration updated successfully!");
      setGeminiKey("");
      loadAll();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>System Diagnostics & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          PauseAI Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Manage AI providers, configure your Gemini API key, inspect active embedding models, and monitor storage health.
        </p>
      </div>

      <div className="space-y-6">
        {/* Active Engine Card */}
        <div className="p-6 rounded-3xl bg-[#0D1322] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Active Answering Engine
              </span>
              <h2 className="text-base font-bold text-white">
                {settings?.active_mode || "Local Extractive RAG Fallback"}
              </h2>
              <p className="text-xs text-slate-400">
                {settings?.gemini_active
                  ? "Gemini generative model active with strict system constraints."
                  : "Zero-dependency local extractive fallback guaranteeing offline reliability."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                settings?.gemini_active
                  ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
                  : "bg-cyan-950/70 border border-cyan-500/40 text-cyan-300"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {settings?.gemini_active ? "Cloud Active" : "Local Extractive Active"}
            </span>
          </div>
        </div>

        {/* Gemini Provider Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1322] border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Key className="w-4 h-4 text-purple-400" />
            <h3>Google Gemini API Credentials</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Optional: Enter your Gemini API key to activate natural generative summaries, diverse quiz variations, and dynamic conversational interview evaluations. If left blank, PauseAI operates seamlessly in extractive local fallback mode.
          </p>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex justify-between">
                <span>Gemini API Key</span>
                {settings?.gemini_api_key_configured && (
                  <span className="text-[10px] font-mono text-emerald-400">
                    Configured ({settings.masked_gemini_api_key})
                  </span>
                )}
              </label>
              <input
                type="password"
                placeholder={
                  settings?.gemini_api_key_configured
                    ? "Enter new key to replace existing..."
                    : "AIzaSy..."
                }
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Target Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended, Low Latency)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-700/50 text-indigo-300 text-xs">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold transition-all shadow-md shadow-purple-600/30 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* System & Architecture Diagnostics */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1322] border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Infrastructure & Embedding Diagnostics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Embedding Model
              </span>
              <span className="text-white font-mono font-bold">
                {settings?.embedding_model || "all-MiniLM-L6-v2"}
              </span>
              <span className="text-slate-400 block text-[11px]">Normalized dense 384-dim vectors</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Compute Device
              </span>
              <span className="text-white font-mono font-bold capitalize">
                {settings?.device || "cpu (Apple Silicon Optimized)"}
              </span>
              <span className="text-slate-400 block text-[11px]">Torch runtime</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                Relational Database
              </span>
              <span className="text-white font-mono font-bold">
                SQLite (pauseai.db)
              </span>
              <span className="text-emerald-400 block text-[11px]">Connection: Healthy</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                RAG Ranking Algorithm
              </span>
              <span className="text-white font-mono font-bold">
                BM25 + Dense Vectors (RRF)
              </span>
              <span className="text-cyan-400 block text-[11px]">Server-enforced timestamp gate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
