"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";

export default function HeatmapPage() {
    const { articles, loading } = useLiveFeed();

    const fakeArticles = articles.filter((a: any) =>
        ["FAKE", "FALSE", "MISLEADING", "PANTS ON FIRE"].includes((a.verdict || "").toUpperCase())
    );
    const totalFlagged = fakeArticles.length;

    // Build severity-ranked narratives from live data
    const narratives = articles.slice(0, 4).map((a: any, i: number) => {
        const isFake = ["FAKE", "FALSE", "MISLEADING"].includes((a.verdict || "").toUpperCase());
        const severity = i === 0 ? "Critical" : i === 1 ? "High" : i === 2 ? "Moderate" : "Low";
        const colorMap: Record<string, string> = {
            Critical: "accent-pink",
            High: "accent-yellow",
            Moderate: "accent-cyan",
            Low: "slate-500",
        };
        const velocity = Math.max(10, 900 - i * 250 + Math.floor(Math.random() * 50));
        const width = `${Math.max(15, 85 - i * 20)}%`;
        return { ...a, severity, color: colorMap[severity], velocity, width, isFake };
    });

    return (
        <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Map Grid */}
                <div className="absolute inset-0 z-0 bg-[#0B0F19] map-grid opacity-30 pointer-events-none" />
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle,transparent,#0B0F19_80%)] opacity-80 pointer-events-none" />

                {/* Left Sidebar: Trending Narratives */}
                <aside className="w-80 flex flex-col glass-panel border-r border-white/5 z-10">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Trending Narratives</h2>
                        <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-white text-sm">filter_list</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 logs-scroll">
                        {loading && (
                            <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                                <span className="material-symbols-outlined animate-spin mr-2 text-sm">progress_activity</span>
                                Loading...
                            </div>
                        )}
                        {narratives.map((n: any, i: number) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg bg-[#1e293b]/40 border-l-2 hover:bg-[#1e293b]/60 transition-colors group cursor-pointer relative overflow-hidden ${`border-${n.color}`
                                    }`}
                                style={{ borderLeftColor: n.color === "accent-pink" ? "#ff0055" : n.color === "accent-yellow" ? "#f2c94c" : n.color === "accent-cyan" ? "#00e5ff" : "#64748b" }}
                            >
                                {n.severity === "Critical" && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <span className="material-symbols-outlined text-[#ff0055] text-[16px] animate-pulse">warning</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                        style={{
                                            color: n.color === "accent-pink" ? "#ff0055" : n.color === "accent-yellow" ? "#f2c94c" : n.color === "accent-cyan" ? "#00e5ff" : "#94a3b8",
                                            backgroundColor: n.color === "accent-pink" ? "rgba(255,0,85,0.1)" : n.color === "accent-yellow" ? "rgba(242,201,76,0.1)" : n.color === "accent-cyan" ? "rgba(0,229,255,0.1)" : "rgba(100,116,139,0.1)",
                                        }}
                                    >
                                        {n.severity}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: #{(n.id || "").slice(-4) || `000${i}`}</span>
                                </div>
                                <h3 className="text-sm font-semibold text-white leading-snug mb-3 group-hover:text-[#0dccf2] transition-colors truncate">
                                    {(n.text || "").slice(0, 50)}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-slate-400">Velocity</span>
                                        <span className="text-xs font-mono font-bold" style={{ color: n.color === "accent-pink" ? "#ff0055" : n.color === "accent-yellow" ? "#f2c94c" : "#0dccf2" }}>
                                            {n.velocity}/min
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 h-1 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all"
                                            style={{
                                                width: n.width,
                                                backgroundColor: n.color === "accent-pink" ? "#ff0055" : n.color === "accent-yellow" ? "#f2c94c" : n.color === "accent-cyan" ? "#0dccf2" : "#64748b",
                                                boxShadow: `0 0 10px ${n.color === "accent-pink" ? "rgba(255,0,85,0.5)" : n.color === "accent-yellow" ? "rgba(242,201,76,0.5)" : "rgba(13,204,242,0.5)"}`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Center: Globe Visualization */}
                <main className="flex-1 relative flex flex-col z-0">
                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        {["add", "remove", "my_location", "layers"].map((icon) => (
                            <button key={icon} className="bg-[#151b2b]/90 border border-white/10 p-2 rounded text-white hover:bg-[#0dccf2] hover:text-[#151b2b] transition-colors shadow-lg">
                                <span className="material-symbols-outlined">{icon}</span>
                            </button>
                        ))}
                    </div>

                    {/* Globe */}
                    <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                        <div className="w-[500px] h-[500px] rounded-full border border-white/5 relative flex items-center justify-center animate-[spin_60s_linear_infinite]">
                            <div className="absolute inset-0 rounded-full border border-white/5 opacity-30" style={{ transform: "rotateX(60deg)" }} />
                            <div className="absolute inset-0 rounded-full border border-white/5 opacity-30" style={{ transform: "rotateY(60deg)" }} />
                            <div className="absolute inset-0 rounded-full border border-white/10 opacity-20" style={{ transform: "rotate(45deg)" }} />

                            {/* Hotspots */}
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#ff0055]/20 blur-3xl animate-pulse" />
                            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-[#ff0055] rounded-full shadow-[0_0_20px_rgba(255,0,85,1)] animate-ping" />

                            <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-[#f2c94c]/20 blur-3xl animate-pulse" />
                            <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-[#f2c94c] rounded-full shadow-[0_0_20px_rgba(242,201,76,1)]" />

                            <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-[#0dccf2]/20 blur-2xl animate-pulse" />
                            <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#0dccf2] rounded-full shadow-[0_0_20px_rgba(13,204,242,1)]" />
                        </div>

                        {/* Map Tooltip */}
                        {articles.length > 0 && (
                            <div className="absolute top-[28%] left-[28%] bg-[#151b2b]/90 border border-[#ff0055]/50 p-3 rounded shadow-2xl backdrop-blur-md z-30 w-48">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-white uppercase">Threat Detected</span>
                                    <span className="w-2 h-2 bg-[#ff0055] rounded-full" />
                                </div>
                                <p className="text-[10px] text-slate-300 mb-2">
                                    Level: <span className={`font-bold ${totalFlagged > 3 ? "text-[#ff0055]" : "text-[#f2c94c]"}`}>
                                        {totalFlagged > 3 ? "CRITICAL" : "ELEVATED"}
                                    </span>
                                </p>
                                <div className="w-full bg-slate-700 h-0.5 mb-1">
                                    <div className="bg-[#ff0055] h-full" style={{ width: `${Math.min(90, totalFlagged * 20)}%` }} />
                                </div>
                                <p className="text-[9px] text-slate-400 font-mono">{totalFlagged} flagged articles</p>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0F19_90%)] pointer-events-none" />
                    </div>

                    {/* Bottom Timeline */}
                    <div className="h-20 glass-panel border-t border-white/5 flex flex-col justify-center px-6 z-20">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-4">
                                <button className="text-[#0dccf2] hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">play_circle</span>
                                </button>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Migration Timeline</span>
                            </div>
                            <span className="text-xs font-mono text-[#0dccf2]">Last 24 Hours</span>
                        </div>
                        <div className="relative w-full h-8 flex items-center">
                            <div className="absolute w-full h-1 bg-slate-700/50 rounded-full" />
                            <div className="absolute w-[65%] h-1 bg-gradient-to-r from-[#0dccf2]/30 to-[#0dccf2] rounded-full shadow-[0_0_10px_rgba(13,204,242,0.5)]" />
                            <div className="absolute left-[65%] w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] cursor-pointer hover:scale-125 transition-transform border-2 border-[#0dccf2] z-10" />
                        </div>
                        <div className="flex justify-between w-full mt-1">
                            {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((t) => (
                                <span key={t} className="text-[10px] text-slate-500 font-mono">{t}</span>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Platform Analytics */}
                <aside className="w-80 flex flex-col glass-panel border-l border-white/5 z-10">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Platform Breakdown</h2>
                        <span className="material-symbols-outlined text-slate-500 text-sm">pie_chart</span>
                    </div>
                    {/* Donut Chart */}
                    <div className="p-6 border-b border-white/5 flex flex-col items-center">
                        <div
                            className="relative w-40 h-40 rounded-full mb-6"
                            style={{ background: "conic-gradient(from 0deg, #0dccf2 0% 45%, #2e3b52 45% 46%, #f2c94c 46% 76%, #2e3b52 76% 77%, #ff0055 77% 100%)" }}
                        >
                            <div className="absolute inset-4 bg-[#151b2b] rounded-full flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{articles.length}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Flagged Posts</span>
                            </div>
                        </div>
                        <div className="w-full space-y-3">
                            {[
                                { label: "X (Twitter)", pct: "45%", color: "#0dccf2" },
                                { label: "Telegram", pct: "30%", color: "#f2c94c" },
                                { label: "Facebook", pct: "25%", color: "#ff0055" },
                            ].map((p) => (
                                <div key={p.label} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}80` }} />
                                        <span className="text-slate-300">{p.label}</span>
                                    </div>
                                    <span className="font-mono font-bold" style={{ color: p.color }}>{p.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Feed */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 pb-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Analysis Feed</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 logs-scroll">
                            {articles.slice(0, 5).map((a: any, i: number) => (
                                <div key={i} className={`p-3 rounded bg-white/5 border border-white/5 text-xs ${i > 2 ? "opacity-60" : ""}`}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[#0dccf2] font-bold">{a.url ? new URL(a.url).hostname.slice(0, 15) : `Source_${i}`}</span>
                                        <span className="text-slate-500 font-mono">{a.timestamp?.toDate?.()?.toLocaleTimeString?.()?.slice(0, 5) || "now"}</span>
                                    </div>
                                    <p className="text-slate-300 mb-2 truncate">{(a.text || "").slice(0, 60)}</p>
                                    <div className="flex gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${a.verdict === "FAKE" ? "bg-[#ff0055]/20 text-[#ff0055]" : "bg-[#0dccf2]/20 text-[#0dccf2]"
                                            }`}>
                                            {a.verdict || "Pending"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
