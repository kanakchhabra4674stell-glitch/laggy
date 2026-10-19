import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PauseAI — Timestamp-Aware Interactive Learning Platform",
  description: "Experience AI doubt-solving with strict server-enforced timestamp gates, multimodal RAG over transcripts, PDFs & slides, and adaptive AI mock interviews.",
  keywords: ["AI tutor", "timestamp-gated RAG", "educational AI", "multimodal learning", "mock interview AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-cyan-200">
        <Suspense fallback={<div className="h-16 w-full border-b border-[#1F293D] bg-[#0B0F19]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
