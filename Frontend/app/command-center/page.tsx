"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";

export default function CommandCenterPage() {
    const { articles, loading } = useLiveFeed();
    const latest = articles[0];

    const confidence = latest ? Math.round((latest.confidence || 0.84) * 100) : 0;
    const dashOffset = 283 - (283 * confidence) / 100;
    const isFake = latest && ["FAKE", "FALSE", "MISLEADING"].includes((latest.verdict || "").toUpperCase());

    return (
        <div className="flex h-screen bg-bg-dark text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-surface-dark bg-bg-dark/95 backdrop-blur-md px-6 py-4 shadow-lg">
                    <div className="flex items-center gap-3 text-white">
                        <span className="material-symbols-outlined text-[32px] animate-pulse-slow text-stitch-primary">radar</span>
                        <h2 className="text-white text-xl font-bold tracking-tight uppercase">
                            AI Truth Scanner <span className="text-accent-cyan text-xs font-normal align-top ml-1">v4.2</span>
                        </h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <span className="text-white/80 text-sm font-medium">Dashboard</span>
                        <span className="text-white/60 text-sm font-medium">History</span>
                        <span className="text-white/60 text-sm font-medium">Live Feed</span>
                    </nav>
                </header>

                <main className="flex-1 flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto w-full gap-6 overflow-auto">
                    {/* Hero Search */}
                    <section className="flex flex-col gap-6">
                        <div className="relative w-full max-w-4xl mx-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan via-stitch-primary to-accent-magenta rounded-lg blur opacity-25 animate-pulse-slow" />
                            <div className="relative flex w-full items-center bg-card-dark rounded-lg shadow-2xl border border-surface-dark overflow-hidden">
                                <div className="pl-4 text-slate-400">
                                    <span className="material-symbols-outlined">link</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 h-14 md:h-16 px-4 text-base md:text-lg font-mono"
                                    placeholder="Paste URL or text snippet to analyze credibility..."
                                    readOnly
                                    value={latest?.url || latest?.text?.slice(0, 60) || "Awaiting data..."}
                                />
                                <button className="h-10 md:h-12 mr-2 px-6 bg-stitch-primary hover:bg-stitch-primary-dark text-white text-sm font-bold tracking-wide rounded transition-all shadow-neon-blue flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">search_check</span>
                                    SCAN
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-center gap-8 text-xs text-slate-400 font-mono uppercase tracking-widest">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />System Online</span>
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">database</span>Database Synced</span>
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">memory</span>AI Models Active</span>
                        </div>
                    </section>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                        {/* Left Column: Primary Metrics */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Credibility Score Widget */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-8xl text-stitch-primary">verified_user</span>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-accent-cyan rounded-full" />
                                        Credibility Score
                                    </h3>
                                    <div className="flex items-center gap-8">
                                        <div className="relative">
                                            <div
                                                className="radial-progress"
                                                style={{
                                                    "--value": `${confidence}%`,
                                                    "--thickness": "10px",
                                                    "--color": "#197fe6",
                                                    width: "120px",
                                                    height: "120px",
                                                } as any}
                                            >
                                                <span className="text-3xl font-bold text-white font-display">
                                                    {confidence}<span className="text-sm align-top">%</span>
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 rounded-full shadow-neon-blue opacity-20" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-bold text-lg flex items-center gap-1 ${confidence > 60 ? "text-green-400" : "text-yellow-400"}`}>
                                                <span className="material-symbols-outlined text-base">
                                                    {confidence > 60 ? "check_circle" : "warning"}
                                                </span>
                                                {confidence > 60 ? "High Confidence" : "Medium Confidence"}
                                            </span>
                                            <p className="text-slate-400 text-sm">
                                                {latest?.grounded_evidence?.slice(0, 120) || "Source analysis pending cross-referencing."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sentiment Analysis */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6 flex flex-col justify-between">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-accent-magenta rounded-full" />
                                        Sentiment Analysis
                                    </h3>
                                    <div className="flex items-end justify-between mb-2">
                                        <span className="text-3xl font-bold text-white tracking-tight">
                                            {isFake ? "Emotional" : "Neutral"}
                                        </span>
                                        <span className={`text-sm font-bold px-2 py-1 rounded ${isFake ? "text-accent-magenta bg-accent-magenta/10" : "text-green-400 bg-green-400/10"}`}>
                                            {isFake ? "Subjective Tone" : "Balanced Tone"}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-700">
                                            <div className="bg-green-500 h-full transition-all" style={{ width: isFake ? "25%" : "60%" }} />
                                            <div className="bg-slate-400 h-full transition-all" style={{ width: isFake ? "15%" : "25%" }} />
                                            <div className="bg-red-500 h-full transition-all" style={{ width: isFake ? "60%" : "15%" }} />
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-slate-400">
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Positive</div>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Neutral</div>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Negative</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Source Cross-Reference */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl p-6 flex-1">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-stitch-primary text-lg">share_reviews</span>
                                        Source Cross-Reference
                                    </h3>
                                    <span className="bg-stitch-primary/20 text-stitch-primary text-xs font-bold px-2 py-1 rounded border border-stitch-primary/30">
                                        {articles.length} MATCHES
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {articles.slice(0, 4).map((a: any, i: number) => {
                                        const domain = a.url ? new URL(a.url).hostname.replace("www.", "") : `source-${i + 1}`;
                                        return (
                                            <div key={i} className="group flex items-start gap-4 p-4 rounded-lg bg-surface-dark/30 hover:bg-surface-dark/50 border border-transparent hover:border-stitch-primary/50 transition-all cursor-pointer">
                                                <div className="size-10 rounded bg-white flex items-center justify-center shrink-0">
                                                    <span className="text-black font-serif font-black text-xl">{domain[0]?.toUpperCase()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-white font-bold truncate text-sm">{domain}</h4>
                                                        <span className={`text-xs font-bold ${a.verdict === "REAL" ? "text-green-400" : "text-yellow-400"}`}>
                                                            {Math.round((a.confidence || 0.8) * 100)}% Trust
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm line-clamp-2 mt-1">{(a.text || "").slice(0, 80)}</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <span className="text-[10px] uppercase font-bold bg-bg-dark px-2 py-0.5 rounded text-slate-300">{a.verdict}</span>
                                                        <span className="text-[10px] uppercase font-bold bg-bg-dark px-2 py-0.5 rounded text-slate-300">{a.verification_method || "AI"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Map & Logs */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* Origin Trace Map */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl p-1 overflow-hidden flex flex-col h-[320px]">
                                <div className="px-5 py-4 bg-card-dark border-b border-surface-dark z-10 flex justify-between items-center">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Origin Trace</h3>
                                    <span className="text-xs text-accent-cyan font-mono">{latest?.url ? "Tracing..." : "Standby"}</span>
                                </div>
                                <div className="relative flex-1 bg-slate-800 w-full overflow-hidden">
                                    {/* Grid Overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(25,127,230,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(25,127,230,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                    {/* Pulse Point */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-accent-magenta rounded-full shadow-[0_0_15px_rgba(255,0,230,0.8)] z-10" />
                                        <div className="absolute w-8 h-8 bg-accent-magenta rounded-full opacity-40 animate-ping" />
                                        <div className="absolute w-24 h-24 border border-accent-magenta/30 rounded-full animate-pulse" />
                                    </div>
                                    {/* Data Overlay */}
                                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded border border-white/10">
                                        <p className="text-[10px] font-mono text-slate-300">STATUS: ACTIVE</p>
                                        <p className="text-[10px] font-mono text-slate-300">ARTICLES: {articles.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Logs */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl flex-1 flex flex-col min-h-[300px]">
                                <div className="px-5 py-4 border-b border-surface-dark flex justify-between items-center bg-surface-dark/20">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Live Analysis Log</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-3 logs-scroll max-h-[300px] lg:max-h-full">
                                    {loading && (
                                        <div className="flex gap-3 text-slate-300 opacity-50">
                                            <span className="text-slate-500 w-12 shrink-0">--:--</span>
                                            <span>Connecting to Firestore...</span>
                                        </div>
                                    )}
                                    {articles.slice(0, 8).map((a: any, i: number) => {
                                        const time = a.timestamp?.toDate?.()?.toLocaleTimeString?.()?.slice(0, 5) || "--:--";
                                        const isFirst = i === 0;
                                        return (
                                            <div
                                                key={i}
                                                className={`flex gap-3 ${isFirst ? "text-green-400 font-bold border-l-2 border-green-500 pl-2 bg-green-500/5 py-1"
                                                        : i === 1 ? "text-accent-cyan"
                                                            : i === 2 ? "text-accent-magenta"
                                                                : `text-slate-300 ${i > 4 ? "opacity-50" : i > 3 ? "opacity-60" : ""}`
                                                    }`}
                                            >
                                                <span className="text-slate-500 w-12 shrink-0">{time}</span>
                                                <span className="truncate">
                                                    {isFirst && "✓ "}{a.verdict}: {(a.text || "").slice(0, 60)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-2 border-t border-surface-dark bg-bg-dark/50">
                                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-stitch-primary animate-pulse w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
