"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { useState } from "react";
import { getStandardizedVerdict, capDisplayConfidence, getFriendlySourceName } from "@/lib/verification-display";

export default function AnalysisReportPage() {
    const { articles, loading } = useLiveFeed();
    const [selectedIdx, setSelectedIdx] = useState(0);
    const selected = articles[selectedIdx];

    const isFake = selected && getStandardizedVerdict(selected.verdict) === "FAKE";
    const confidence = selected && selected.confidence !== undefined ? capDisplayConfidence(selected.confidence * 100) : 0;
    const redFlags = selected?.red_flags || [];

    return (
        <div className="flex h-screen bg-bg-dark text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-surface-darker/90 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent-cyan text-2xl">article</span>
                        <h2 className="text-white text-lg font-bold tracking-tight uppercase">Detailed Analysis Report</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFake ? "bg-risk-high/20 text-risk-high border border-risk-high/30" : "bg-risk-low/20 text-risk-low border border-risk-low/30"}`}>
                            {selected?.verdict || "PENDING"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{confidence}% confidence</span>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Article List */}
                    <aside className="w-80 border-r border-white/5 flex flex-col bg-surface-darker/50">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Verified Articles</h3>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input
                                    className="w-full bg-surface-dark border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-accent-cyan/50 focus:border-accent-cyan/50"
                                    placeholder="Search reports..."
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto logs-scroll">
                            {loading && (
                                <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                                    <span className="material-symbols-outlined animate-spin mr-2 text-sm">progress_activity</span>
                                    Loading...
                                </div>
                            )}
                            {articles.map((a: any, i: number) => {
                                const isActive = i === selectedIdx;
                                const aIsFake = getStandardizedVerdict(a.verdict) === "FAKE";
                                return (
                                    <button
                                        key={a.id || i}
                                        onClick={() => setSelectedIdx(i)}
                                        className={`w-full text-left p-4 border-b border-white/5 transition-all ${isActive ? "bg-accent-cyan/5 border-l-2 border-l-accent-cyan" : "hover:bg-white/5 border-l-2 border-l-transparent"}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${aIsFake ? "bg-risk-high/20 text-risk-high" : "bg-risk-low/20 text-risk-low"}`}>
                                                {a.verdict || "PENDING"}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                                {a.timestamp?.toDate?.()?.toLocaleDateString?.() || ""}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300 line-clamp-2 mt-1">{(a.text || "").slice(0, 80)}</p>
                                        {a.red_flags?.length > 0 && (
                                            <div className="mt-2 flex gap-1">
                                                <span className="text-[10px] text-risk-high bg-risk-high/10 px-1.5 py-0.5 rounded">
                                                    {a.red_flags.length} flags
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Right Panel: Detailed Analysis */}
                    <main className="flex-1 overflow-auto p-6 space-y-6">
                        {!selected ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">article</span>
                                <p>Select an article to view its analysis report</p>
                            </div>
                        ) : (
                            <>
                                {/* Article Header */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${isFake ? "bg-risk-high/20 text-risk-high border border-risk-high/30" : "bg-risk-low/20 text-risk-low border border-risk-low/30"}`}>
                                                    {isFake ? "⚠ MISLEADING" : "✓ VERIFIED"}
                                                </span>
                                                <span className="text-xs text-slate-500">{selected.verification_method || "AI Verification"}</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-white mb-2">{(selected.text || "").slice(0, 100)}</h2>
                                            {selected.url && (
                                                <a href={selected.url} target="_blank" rel="noreferrer" className="text-accent-cyan text-sm hover:underline font-mono">
                                                    {getFriendlySourceName(selected.url)}
                                                </a>
                                            )}
                                        </div>
                                        {/* Confidence Gauge */}
                                        <div className="relative size-24 shrink-0 ml-4">
                                            <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                                                <circle
                                                    cx="50" cy="50" r="40" fill="none"
                                                    stroke={isFake ? "#ef4444" : "#10b981"}
                                                    strokeWidth="8"
                                                    strokeDasharray="251"
                                                    strokeDashoffset={251 - (251 * confidence) / 100}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-bold text-white">{confidence}%</span>
                                                <span className="text-[9px] text-slate-400 uppercase">conf</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Article Text with Annotations */}
                                    <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-stitch-primary text-base">description</span>
                                            Article Content
                                        </h3>
                                        <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                                            {(selected.text || "").split(". ").map((sentence: string, i: number) => {
                                                const hasFlag = redFlags.some((f: string) =>
                                                    sentence.toLowerCase().includes(f.toLowerCase())
                                                );
                                                return (
                                                    <span
                                                        key={i}
                                                        className={hasFlag ? "bg-risk-high/20 border-b-2 border-risk-high/50 px-0.5" : ""}
                                                    >
                                                        {sentence}{i < (selected.text || "").split(". ").length - 1 ? ". " : ""}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Side Analysis */}
                                    <div className="space-y-6">
                                        {/* Red Flags */}
                                        <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-risk-high text-base">flag</span>
                                                Red Flags ({redFlags.length})
                                            </h3>
                                            {redFlags.length > 0 ? (
                                                <div className="space-y-3">
                                                    {redFlags.map((flag: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-risk-high/5 border border-risk-high/10">
                                                            <span className="material-symbols-outlined text-risk-high text-base mt-0.5">warning</span>
                                                            <div>
                                                                <p className="text-sm text-white font-medium">{flag}</p>
                                                                <p className="text-xs text-slate-400 mt-1">Detected by AI linguistic analysis</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500">No red flags detected in this article.</p>
                                            )}
                                        </div>

                                        {/* Grounded Evidence */}
                                        <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-risk-low text-base">fact_check</span>
                                                Grounded Evidence
                                            </h3>
                                            <div className="text-sm text-slate-300 leading-relaxed bg-surface-dark/50 p-4 rounded-lg border border-white/5">
                                                {selected.grounded_evidence || "No grounding evidence available for this article."}
                                            </div>
                                        </div>

                                        {/* Source Reputation */}
                                        <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-stitch-primary text-base">shield</span>
                                                Source Reputation
                                            </h3>
                                            <div className="space-y-3">
                                                {[
                                                    { label: "Fact-Check Score", value: `${confidence}%`, color: isFake ? "text-risk-high" : "text-risk-low" },
                                                    { label: "Bias Rating", value: "N/A", color: "text-slate-500" },
                                                    { label: "Historical Accuracy", value: "N/A", color: "text-slate-500" },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex justify-between items-center p-3 bg-surface-dark/50 rounded border border-white/5">
                                                        <span className="text-xs text-slate-400">{item.label}</span>
                                                        <span className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
