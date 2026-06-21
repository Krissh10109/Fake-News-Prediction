"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { getStandardizedVerdict, getFriendlySourceName, capDisplayConfidence } from "@/lib/verification-display";

export default function ForensicMatrixPage() {
    const { articles, loading } = useLiveFeed();
    const latest = articles[0];

    const confidence = latest && latest.confidence !== undefined ? capDisplayConfidence(latest.confidence * 100) : 0;
    const dashOffset = 283 - (283 * confidence) / 100;
    const isFake = latest && getStandardizedVerdict(latest.verdict) === "FAKE";
    const oriScore = "N/A";
    const manipulationIndex = "N/A";

    return (
        <div className="flex h-screen bg-bg-dark text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Nav */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-700 bg-surface-darker px-6 py-3 sticky top-0 z-50 shadow-lg">
                    <div className="flex items-center gap-4 text-white">
                        <span className="material-symbols-outlined text-3xl text-accent-cyan animate-pulse">hub</span>
                        <div>
                            <h2 className="text-white text-lg font-bold leading-tight tracking-wider">NEXUS-VERIFY</h2>
                            <p className="text-[10px] text-accent-cyan tracking-[0.2em] opacity-80">FORENSIC INTELLIGENCE SUITE</p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-1 justify-center px-8">
                        <div className="flex items-center gap-2 px-4 py-1 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
                            </span>
                            <span className="text-xs font-medium text-accent-cyan tracking-widest">SYSTEM ONLINE // MONITORING ACTIVE</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-surface-dark border border-slate-600 hover:border-slate-400 text-white text-xs font-bold tracking-wider transition-all">EXPORT</button>
                        <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-accent-cyan hover:bg-cyan-400 text-surface-darker text-xs font-bold tracking-wider shadow-glow transition-all">NEW SCAN</button>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 cyber-grid relative overflow-auto">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isFake ? "bg-risk-high/20 text-risk-high border-risk-high/30" : "bg-risk-low/20 text-risk-low border-risk-low/30"}`}>
                                    {isFake ? "HIGH PRIORITY" : "STANDARD"}
                                </span>
                                <span className="text-slate-500 text-xs">ID: #{(latest?.id || "").slice(-8) || "pending"}</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">OPERATION: DEEP TRACE</h1>
                            <p className="text-slate-400 text-sm mt-1">Target: {latest ? `"${(latest.text || "").slice(0, 50)}..."` : "Awaiting data"}</p>
                        </div>
                        <div className="flex gap-4 text-right">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Articles</p>
                                <p className="text-xl font-mono text-accent-cyan">{articles.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nodes Analyzed</p>
                                <p className="text-xl font-mono text-white">N/A</p>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 min-h-[600px]">
                        {/* Module 1: Source Forensics */}
                        <div className="bg-surface-dark border border-slate-700 rounded-lg p-5 flex flex-col gap-4 shadow-lg relative overflow-hidden group hover:border-accent-cyan/50 transition-colors">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl">dns</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <h3 className="text-accent-cyan text-sm font-bold tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">travel_explore</span> SOURCE FORENSICS
                                </h3>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">MODULE 01</span>
                            </div>
                            {/* ORI Gauge */}
                            <div className="relative flex flex-col items-center justify-center py-2">
                                <div className="w-32 h-16 overflow-hidden relative">
                                    <div className="absolute w-32 h-32 rounded-full border-[12px] border-slate-700 top-0 left-0" />
                                    <div
                                        className="absolute w-32 h-32 rounded-full border-[12px] border-transparent top-0 left-0"
                                        style={{
                                            borderTopColor: isFake ? "#ef4444" : "#10b981",
                                            borderRightColor: isFake ? "#ef4444" : "#10b981",
                                            transform: "rotate(-135deg)",
                                        }}
                                    />
                                </div>
                                <div className="absolute top-8 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">{oriScore}</span>
                                    <span className={`text-[10px] font-bold uppercase text-slate-500`}>
                                        {isFake ? "Critical Risk" : "Low Risk"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Outlet Reputation Index (ORI)</p>
                            </div>
                            {/* WHOIS Data */}
                            <div className="grid grid-cols-1 gap-2 mt-auto">
                                {[
                                    { label: "Source", value: getFriendlySourceName(latest?.url || "") },
                                    { label: "Verdict", value: latest?.verdict || "Pending" },
                                    { label: "Method", value: latest?.verification_method || "AI" },
                                ].map((d) => (
                                    <div key={d.label} className="bg-slate-800/50 p-3 rounded border border-slate-700 flex justify-between items-center">
                                        <span className="text-xs text-slate-400">{d.label}</span>
                                        <span className="text-xs text-white font-mono">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Module 2: Bayesian Confidence (spans 2 cols) */}
                        <div className="md:col-span-2 lg:col-span-1 xl:col-span-2 bg-surface-darker border border-accent-cyan/30 rounded-lg p-6 relative flex flex-col items-center justify-center shadow-glow overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-cyan/10 via-transparent to-transparent opacity-50" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-30" />

                            <div className="z-10 text-center mb-6">
                                <h2 className="text-accent-cyan text-sm font-bold tracking-[0.2em] mb-1">BAYESIAN CONFIDENCE SCORE</h2>
                                <p className="text-slate-400 text-xs">AGGREGATED PROBABILITY OF VERACITY</p>
                            </div>

                            {/* Main Ring */}
                            <div className="relative z-10 size-64 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border border-dashed border-slate-600 animate-[spin_10s_linear_infinite]" />
                                <div className="absolute inset-2 rounded-full border border-slate-700" />
                                <svg className="size-56 -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="none" r="45" stroke="#1e293b" strokeWidth="6" />
                                    <circle
                                        className="drop-shadow-[0_0_10px_rgba(13,204,242,0.6)] transition-all duration-1000"
                                        cx="50" cy="50" fill="none" r="45"
                                        stroke="#0dccf2"
                                        strokeDasharray="283"
                                        strokeDashoffset={dashOffset}
                                        strokeWidth="6"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-6xl font-bold text-white tracking-tighter drop-shadow-lg">
                                        {confidence}<span className="text-2xl text-accent-cyan">%</span>
                                    </span>
                                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-accent-cyan/20 rounded-full border border-accent-cyan/40">
                                        <span className="size-2 bg-accent-cyan rounded-full animate-pulse" />
                                        <span className="text-xs font-bold text-accent-cyan tracking-wider">{isFake ? "FLAGGED" : "VERIFIED"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Stats */}
                            <div className="grid grid-cols-3 gap-4 w-full mt-8 z-10">
                                <div className="text-center border-r border-slate-700">
                                    <p className="text-[10px] text-slate-500 uppercase">Prior Probability</p>
                                    <p className="text-lg font-mono text-white">N/A</p>
                                </div>
                                <div className="text-center border-r border-slate-700">
                                    <p className="text-[10px] text-slate-500 uppercase">Likelihood Ratio</p>
                                    <p className="text-lg font-mono text-accent-cyan">N/A</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">Err Margin</p>
                                    <p className="text-lg font-mono text-white">N/A</p>
                                </div>
                            </div>
                        </div>

                        {/* Module 3: Linguistics */}
                        <div className="bg-surface-dark border border-slate-700 rounded-lg p-5 flex flex-col gap-4 shadow-lg relative group hover:border-accent-cyan/50 transition-colors">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <h3 className="text-accent-cyan text-sm font-bold tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">record_voice_over</span> LINGUISTICS
                                </h3>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">MODULE 02</span>
                            </div>
                            {/* Manipulation Index */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Manipulation Index</span>
                                    <span className={`font-bold text-slate-500`}>
                                        N/A
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-risk-med to-risk-high transition-all"
                                        style={{ width: `0%` }}
                                    />
                                </div>
                            </div>
                            {/* Word Cloud */}
                            <div className="flex-1 bg-slate-800/30 rounded border border-slate-700/50 p-4 relative overflow-hidden flex flex-wrap content-center justify-center gap-2">
                                {(latest?.red_flags?.length ? latest.red_flags : ["No data available"]).map((word: string, i: number) => (
                                    <span
                                        key={i}
                                        className={`${i % 3 === 0 ? "text-risk-high text-lg font-bold" : i % 3 === 1 ? "text-risk-med text-sm font-semibold" : "text-slate-400 text-xs"} ${i % 5 === 0 ? "rotate-[-5deg]" : i % 5 === 2 ? "rotate-[3deg]" : ""}`}
                                        style={{ opacity: Math.max(0.4, 1 - i * 0.1) }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded">
                                <span className="material-symbols-outlined text-sm text-risk-high">warning</span>
                                {isFake ? "Detected high density of emotive loading." : "Low manipulative language detected."}
                            </div>
                        </div>

                        {/* Module 4: Factual Cross-Verification (spans 2 cols) */}
                        <div className="md:col-span-2 lg:col-span-2 bg-surface-dark border border-slate-700 rounded-lg p-5 flex flex-col gap-4 shadow-lg group hover:border-accent-cyan/50 transition-colors">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <h3 className="text-accent-cyan text-sm font-bold tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">fact_check</span> FACTUAL CROSS-VERIFICATION
                                </h3>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">MODULE 03</span>
                            </div>
                            <div className="relative flex-1 min-h-[140px] flex items-center">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 transform -translate-y-1/2 z-0" />
                                <div className="w-full flex justify-between items-center relative z-10 px-2">
                                    {articles.slice(0, 4).map((a: any, i: number) => {
                                        const isCurrent = i === 0;
                                        const isConflict = ["FAKE", "FALSE"].includes((a.verdict || "").toUpperCase());
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 group/event cursor-pointer">
                                                <div className={`rounded-full ${isConflict ? "size-4 bg-risk-high border-4 border-surface-dark shadow-[0_0_10px_rgba(239,68,68,0.5)]" : isCurrent ? "size-4 bg-accent-cyan border-4 border-surface-dark shadow-[0_0_10px_rgba(13,204,242,0.5)]" : "size-3 bg-slate-500 group-hover/event:bg-accent-cyan transition-colors"}`} />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-slate-400">
                                                        {a.timestamp?.toDate?.()?.toLocaleDateString?.()?.slice(5) || `Entry ${i + 1}`}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1 rounded ${isConflict ? "text-risk-high bg-risk-high/10" : "text-accent-cyan"}`}>
                                                        {a.verdict || "Pending"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Module 5: Network */}
                        <div className="lg:col-span-1 bg-surface-dark border border-slate-700 rounded-lg p-5 flex flex-col gap-4 shadow-lg group hover:border-accent-cyan/50 transition-colors">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <h3 className="text-accent-cyan text-sm font-bold tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">hub</span> NETWORK
                                </h3>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">MODULE 04</span>
                            </div>
                            <div className="relative flex-1 bg-slate-900 rounded border border-slate-700 overflow-hidden min-h-[160px]">
                                <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                                    <line stroke="#475569" strokeWidth="1" x1="50" x2="120" y1="50" y2="80" />
                                    <line stroke="#475569" strokeWidth="1" x1="120" x2="200" y1="80" y2="60" />
                                    <line stroke="#475569" strokeWidth="1" x1="120" x2="150" y1="80" y2="130" />
                                    <line stroke="#475569" strokeWidth="1" x1="200" x2="250" y1="60" y2="90" />
                                    <line stroke="#475569" strokeWidth="1" x1="150" x2="220" y1="130" y2="140" />
                                    <circle cx="50" cy="50" fill={isFake ? "#ef4444" : "#10b981"} r="4" />
                                    <circle className="animate-pulse" cx="120" cy="80" fill={isFake ? "#ef4444" : "#0dccf2"} r="6" />
                                    <circle cx="200" cy="60" fill="#94a3b8" r="3" />
                                    <circle cx="150" cy="130" fill="#94a3b8" r="4" />
                                    <circle cx="220" cy="140" fill="#94a3b8" r="3" />
                                    <circle cx="250" cy="90" fill="#94a3b8" r="3" />
                                </svg>
                                <div className="absolute bottom-2 right-2 flex flex-col items-end pointer-events-none">
                                    <div className={`flex items-center gap-1.5 bg-surface-darker/90 px-2 py-1 rounded border ${isFake ? "border-risk-high/30" : "border-risk-low/30"}`}>
                                        <span className={`size-2 rounded-full animate-pulse ${isFake ? "bg-risk-high" : "bg-risk-low"}`} />
                                        <span className={`text-[10px] font-bold ${isFake ? "text-risk-high" : "text-risk-low"}`}>
                                            {isFake ? "CIB DETECTED" : "CLEAN NETWORK"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-1">{isFake ? "Pattern: Astroturfing" : "No anomalies"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Module 6: Cognitive Bias */}
                        <div className="md:col-span-1 lg:col-span-1 bg-surface-dark border border-slate-700 rounded-lg p-5 flex flex-col gap-4 shadow-lg group hover:border-accent-cyan/50 transition-colors">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <h3 className="text-accent-cyan text-sm font-bold tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">psychology</span> COGNITIVE BIAS
                                </h3>
                                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">MODULE 05</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                                <div className="relative size-32 radar-chart-bg rounded-full border border-slate-700/50">
                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700 transform -translate-x-1/2" />
                                    <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-700 transform -translate-y-1/2" />
                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700 transform -translate-x-1/2 rotate-45" />
                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700 transform -translate-x-1/2 -rotate-45" />
                                    <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100">
                                        <polygon
                                            fill="rgba(13, 204, 242, 0.2)"
                                            points={isFake ? "50,10 85,40 70,80 30,80 15,40" : "50,30 70,40 60,65 40,65 30,40"}
                                            stroke="#0dccf2"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                                <div className="absolute top-0 text-[9px] text-risk-high font-bold bg-surface-darker px-1 rounded">OUTRAGE</div>
                                <div className="absolute bottom-0 text-[9px] text-slate-400 bg-surface-darker px-1 rounded">Tribalism</div>
                                <div className="absolute left-0 text-[9px] text-slate-400 bg-surface-darker px-1 rounded">Fear</div>
                                <div className="absolute right-0 text-[9px] text-slate-400 bg-surface-darker px-1 rounded">Bias</div>
                            </div>
                            <div className="text-center mt-auto">
                                <p className="text-xs text-slate-400">Moral Outrage Score: <span className="text-slate-500 font-bold">N/A</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6 bg-surface-darker border-t border-slate-700 p-4 font-mono text-xs text-slate-400 h-32 overflow-y-auto rounded-lg logs-scroll">
                        {articles.slice(0, 6).map((a: any, i: number) => (
                            <p key={i}>
                                <span className={i === 2 ? "text-risk-med" : "text-accent-cyan"}>
                                    [{a.timestamp?.toDate?.()?.toLocaleTimeString?.()?.slice(0, 8) || "--:--:--"}]
                                </span>
                                {" "}{i === 0 ? "SYSTEM" : i === 1 ? "NETWORK" : i === 2 ? "ALERT" : "SOURCE"}: {(a.text || "").slice(0, 70)}
                            </p>
                        ))}
                        <p className="animate-pulse">
                            <span className="text-accent-cyan">[LIVE]</span> Calculating final confidence intervals...
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
