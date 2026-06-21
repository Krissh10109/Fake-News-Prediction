"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { useMemo, useState } from "react";
import { getStandardizedVerdict, getFriendlySourceName } from "@/lib/verification-display";

interface SourceProfile {
    domain: string;
    articles: any[];
    totalArticles: number;
    fakeCount: number;
    realCount: number;
    trustScore: number;
    avgConfidence: number;
    verdicts: string[];
}

export default function CredibilityPage() {
    const { articles, loading } = useLiveFeed();
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Build source profiles from live data
    const sourceProfiles = useMemo(() => {
        const map: Record<string, SourceProfile> = {};
        articles.forEach((a: any) => {
            let domain = getFriendlySourceName(a.url);

            if (!map[domain]) {
                map[domain] = { domain, articles: [], totalArticles: 0, fakeCount: 0, realCount: 0, trustScore: 0, avgConfidence: 0, verdicts: [] };
            }
            map[domain].articles.push(a);
            map[domain].totalArticles++;
            map[domain].verdicts.push(a.verdict || "PENDING");

            const isFake = getStandardizedVerdict(a.verdict) === "FAKE";
            const isReal = getStandardizedVerdict(a.verdict) === "REAL";
            if (isFake) map[domain].fakeCount++;
            if (isReal) map[domain].realCount++;
            map[domain].avgConfidence += (a.confidence || 0.5);
        });

        return Object.values(map).map((p) => ({
            ...p,
            avgConfidence: p.totalArticles > 0 ? p.avgConfidence / p.totalArticles : 0,
            trustScore: p.totalArticles > 0 ? Math.round(((p.totalArticles - p.fakeCount) / p.totalArticles) * 100) : 50,
        })).sort((a, b) => b.totalArticles - a.totalArticles);
    }, [articles]);

    const filteredProfiles = sourceProfiles.filter((p) =>
        p.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedProfile = sourceProfiles.find((p) => p.domain === selectedDomain);

    return (
        <div className="flex h-screen bg-bg-dark text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-surface-darker/90 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent-cyan text-2xl">shield</span>
                        <h2 className="text-white text-lg font-bold tracking-tight uppercase">Source Credibility Explorer</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono">{sourceProfiles.length} sources indexed</span>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Source List */}
                    <aside className="w-96 border-r border-white/5 flex flex-col bg-surface-darker/50">
                        <div className="p-4 border-b border-white/5 space-y-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input
                                    className="w-full bg-surface-dark border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-accent-cyan/50 focus:border-accent-cyan/50"
                                    placeholder="Search source domains..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {/* Filter Chips */}
                            <div className="flex gap-2 flex-wrap">
                                {["All Sources", "High Trust", "Low Trust", "Flagged"].map((f) => (
                                    <button key={f} className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-accent-cyan/50 hover:bg-accent-cyan/5 transition-all">
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto logs-scroll">
                            {loading && (
                                <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                                    <span className="material-symbols-outlined animate-spin mr-2 text-sm">progress_activity</span>
                                    Indexing sources...
                                </div>
                            )}
                            {filteredProfiles.map((profile) => {
                                const isActive = profile.domain === selectedDomain;
                                const isTrusted = profile.trustScore >= 70;
                                return (
                                    <button
                                        key={profile.domain}
                                        onClick={() => setSelectedDomain(profile.domain)}
                                        className={`w-full text-left p-4 border-b border-white/5 transition-all ${isActive ? "bg-accent-cyan/5 border-l-2 border-l-accent-cyan" : "hover:bg-white/5 border-l-2 border-l-transparent"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Trust Score Circle */}
                                            <div className="relative size-12 shrink-0">
                                                <svg className="size-12 -rotate-90" viewBox="0 0 40 40">
                                                    <circle cx="20" cy="20" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
                                                    <circle
                                                        cx="20" cy="20" r="16" fill="none"
                                                        stroke={isTrusted ? "#10b981" : profile.trustScore >= 40 ? "#f59e0b" : "#ef4444"}
                                                        strokeWidth="3"
                                                        strokeDasharray="100"
                                                        strokeDashoffset={100 - profile.trustScore}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    {profile.trustScore}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-sm font-bold text-white truncate">{profile.domain}</h4>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isTrusted ? "text-risk-low bg-risk-low/10" : "text-risk-high bg-risk-high/10"}`}>
                                                        {isTrusted ? "Trusted" : "Flagged"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-slate-500">{profile.totalArticles} articles</span>
                                                    <span className="text-[10px] text-risk-low">{profile.realCount} real</span>
                                                    <span className="text-[10px] text-risk-high">{profile.fakeCount} fake</span>
                                                </div>
                                                {/* Mini accuracy bar */}
                                                <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full transition-all"
                                                        style={{
                                                            width: `${profile.trustScore}%`,
                                                            backgroundColor: isTrusted ? "#10b981" : profile.trustScore >= 40 ? "#f59e0b" : "#ef4444",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Right Panel: Source Detail */}
                    <main className="flex-1 overflow-auto p-6 space-y-6">
                        {!selectedProfile ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">shield</span>
                                <p className="text-lg">Select a source to explore its credibility profile</p>
                                <p className="text-sm mt-2">Choose from {sourceProfiles.length} indexed sources on the left</p>
                            </div>
                        ) : (
                            <>
                                {/* Source Header */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="size-12 rounded-lg bg-white flex items-center justify-center">
                                                    <span className="text-black font-serif font-black text-2xl">{selectedProfile.domain[0]?.toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">{selectedProfile.domain}</h2>
                                                    <p className="text-sm text-slate-400">{selectedProfile.totalArticles} articles analyzed</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Large Trust Score */}
                                        <div className="relative size-24 shrink-0">
                                            <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                                                <circle
                                                    cx="50" cy="50" r="40" fill="none"
                                                    stroke={selectedProfile.trustScore >= 70 ? "#10b981" : selectedProfile.trustScore >= 40 ? "#f59e0b" : "#ef4444"}
                                                    strokeWidth="8"
                                                    strokeDasharray="251"
                                                    strokeDashoffset={251 - (251 * selectedProfile.trustScore) / 100}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{selectedProfile.trustScore}</span>
                                                <span className="text-[9px] text-slate-400 uppercase">trust</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Articles", value: selectedProfile.totalArticles, icon: "article", color: "text-accent-cyan" },
                                        { label: "Verified Real", value: selectedProfile.realCount, icon: "check_circle", color: "text-risk-low" },
                                        { label: "Flagged Fake", value: selectedProfile.fakeCount, icon: "dangerous", color: "text-risk-high" },
                                        { label: "Avg Confidence", value: `${Math.round(selectedProfile.avgConfidence * 100)}%`, icon: "analytics", color: "text-stitch-primary" },
                                    ].map((m) => (
                                        <div key={m.label} className="bg-card-dark border border-surface-dark rounded-xl p-4 text-center">
                                            <span className={`material-symbols-outlined text-2xl mb-2 ${m.color}`}>{m.icon}</span>
                                            <p className="text-2xl font-bold text-white font-mono">{m.value}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Bias + Accuracy */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Accuracy Trend */}
                                    <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-accent-cyan text-base">trending_up</span>
                                            Factual Reporting Rate
                                        </h3>
                                        <div className="space-y-3">
                                            {["Overall Accuracy", "Source Reliability", "Cross-Reference Match"].map((label, i) => {
                                                const val = [selectedProfile.trustScore, Math.min(100, selectedProfile.trustScore + 10), Math.max(0, selectedProfile.trustScore - 5)][i];
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-400">{label}</span>
                                                            <span className="text-white font-mono">{val}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
                                                                style={{
                                                                    width: `${val}%`,
                                                                    backgroundColor: val >= 70 ? "#10b981" : val >= 40 ? "#f59e0b" : "#ef4444",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bias Orientation */}
                                    <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-accent-magenta text-base">balance</span>
                                            Bias Orientation
                                        </h3>
                                        <div className="flex flex-col items-center">
                                            {/* Political Spectrum Bar */}
                                            <div className="w-full mb-4">
                                                <div className="text-center text-sm text-slate-500 py-4">Insufficient Data</div>
                                            </div>
                                            <div className="space-y-2 w-full">
                                                {[
                                                    { label: "Emotional Loading", val: "N/A" },
                                                    { label: "Fact-based Reporting", val: "N/A" },
                                                    { label: "Source Attribution", val: "N/A" },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex justify-between items-center p-2 bg-surface-dark/50 rounded border border-white/5">
                                                        <span className="text-xs text-slate-400">{item.label}</span>
                                                        <span className={`text-xs font-bold ${item.val === "High" || item.val === "Weak" || item.val === "Missing" ? "text-risk-high" : "text-risk-low"}`}>
                                                            {item.val}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Articles from Source */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-stitch-primary text-base">history</span>
                                        Recent Articles from {selectedProfile.domain}
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedProfile.articles.slice(0, 5).map((a: any, i: number) => {
                                            const aFake = getStandardizedVerdict(a.verdict) === "FAKE";
                                            return (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-dark/30 border border-white/5">
                                                    <span className={`material-symbols-outlined text-base mt-0.5 ${aFake ? "text-risk-high" : "text-risk-low"}`}>
                                                        {aFake ? "dangerous" : "verified"}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white truncate">{(a.text || "").slice(0, 80)}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-[10px] font-bold ${aFake ? "text-risk-high" : "text-risk-low"}`}>{a.verdict}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {a.timestamp?.toDate?.()?.toLocaleDateString?.() || ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
