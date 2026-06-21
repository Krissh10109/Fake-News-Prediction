"use client";

import DashboardNav from "@/components/dashboard-nav";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { capDisplayConfidence, getStandardizedVerdict } from "@/lib/verification-display";

export default function LiveDashboardPage() {
    const { articles, loading } = useLiveFeed();
    const latest = articles[0];

    // Compute stats
    const totalVerified = articles.length;
    const fakeCount = articles.filter((a: any) => getStandardizedVerdict(a.verdict) === "FAKE").length;
    const realCount = articles.filter((a: any) => getStandardizedVerdict(a.verdict) === "REAL").length;
    const reviewCount = totalVerified - fakeCount - realCount;

    // Confidence for gauge
    const confidence = latest && latest.confidence !== undefined ? capDisplayConfidence(latest.confidence * 100) : 0;
    const dashOffset = 283 - (283 * confidence) / 100;

    return (
        <div className="flex h-screen bg-bg-dark text-slate-100 font-display overflow-hidden">
            <DashboardNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-surface-darker/90 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent-cyan text-2xl">stream</span>
                        <h2 className="text-white text-lg font-bold tracking-tight uppercase">Live News Verification</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                            <span className="text-xs font-bold text-green-400 tracking-wider uppercase">Live</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{totalVerified} articles scanned</span>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Verify Input */}
                    <section className="relative w-full max-w-4xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan via-stitch-primary to-accent-magenta rounded-lg blur opacity-25 animate-pulse-slow" />
                        <div className="relative flex w-full items-center bg-card-dark rounded-lg shadow-2xl border border-surface-dark overflow-hidden">
                            <div className="pl-4 text-slate-400">
                                <span className="material-symbols-outlined">link</span>
                            </div>
                            <input
                                className="w-full bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 h-14 px-4 text-base font-mono"
                                placeholder="Paste URL or article text to verify..."
                                readOnly
                                value={latest?.url || latest?.text?.slice(0, 80) || "Waiting for data..."}
                            />
                            <button className="h-10 mr-2 px-6 bg-stitch-primary hover:bg-stitch-primary-dark text-white text-sm font-bold tracking-wide rounded transition-all shadow-neon-blue flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">search_check</span>
                                SCAN
                            </button>
                        </div>
                    </section>

                    {/* Status Indicators */}
                    <div className="flex justify-center gap-8 text-xs text-slate-400 font-mono uppercase tracking-widest">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />System Online</span>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">database</span>Firestore Synced</span>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">memory</span>AI Models Active</span>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Top Row: Credibility + Sentiment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Credibility Score */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-8xl text-stitch-primary">verified_user</span>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-accent-cyan rounded-full" />
                                        Truth Score
                                    </h3>
                                    <div className="flex items-center gap-8">
                                        <div className="relative">
                                            <div
                                                className="radial-progress"
                                                style={{
                                                    "--value": `${confidence}%`,
                                                    "--thickness": "10px",
                                                    "--color": confidence > 60 ? "#10b981" : confidence > 40 ? "#f59e0b" : "#ef4444",
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
                                            <span className={`font-bold text-lg flex items-center gap-1 ${confidence > 60 ? "text-green-400" : confidence > 40 ? "text-yellow-400" : "text-red-400"}`}>
                                                <span className="material-symbols-outlined text-base">
                                                    {confidence > 60 ? "check_circle" : confidence > 40 ? "warning" : "cancel"}
                                                </span>
                                                {confidence > 60 ? "High Confidence" : confidence > 40 ? "Medium Confidence" : "Low Confidence"}
                                            </span>
                                            <p className="text-slate-400 text-sm">
                                                {latest?.verdict
                                                    ? `Verdict: ${latest.verdict}. ${latest.grounded_evidence?.slice(0, 100) || "Analysis complete."}`
                                                    : "Awaiting verification data..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sentiment Analysis */}
                                <div className="bg-card-dark border border-surface-dark rounded-xl p-6 flex flex-col justify-between">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-accent-magenta rounded-full" />
                                        Verification Stats
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between mb-2">
                                            <span className="text-3xl font-bold text-white tracking-tight">{totalVerified}</span>
                                            <span className="text-accent-cyan text-sm font-bold bg-accent-cyan/10 px-2 py-1 rounded">Total Scanned</span>
                                        </div>
                                        {/* Stacked Bar */}
                                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-700">
                                            <div className="bg-green-500 h-full transition-all" style={{ width: `${totalVerified ? (realCount / totalVerified) * 100 : 0}%` }} />
                                            <div className="bg-slate-400 h-full transition-all" style={{ width: `${totalVerified ? (reviewCount / totalVerified) * 100 : 0}%` }} />
                                            <div className="bg-red-500 h-full transition-all" style={{ width: `${totalVerified ? (fakeCount / totalVerified) * 100 : 0}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-green-500" /> Real ({realCount})
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Review ({reviewCount})
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-red-500" /> Fake ({fakeCount})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Feed Cards */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl p-6 flex-1">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-stitch-primary text-lg">rss_feed</span>
                                        Live Misinformation Feed
                                    </h3>
                                    <span className="bg-stitch-primary/20 text-stitch-primary text-xs font-bold px-2 py-1 rounded border border-stitch-primary/30">
                                        {articles.length} ARTICLES
                                    </span>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center h-40 text-slate-500">
                                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                        Loading Firestore data...
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto logs-scroll pr-2">
                                        {articles.slice(0, 15).map((article: any, idx: number) => {
                                            const isFake = getStandardizedVerdict(article.verdict) === "FAKE";
                                            const isReal = getStandardizedVerdict(article.verdict) === "REAL";
                                            return (
                                                <div
                                                    key={article.id || idx}
                                                    className={`group flex items-start gap-4 p-4 rounded-lg bg-surface-dark/30 hover:bg-surface-dark/50 border transition-all cursor-pointer ${isFake ? "border-red-500/20 hover:border-red-500/50" : isReal ? "border-green-500/20 hover:border-green-500/50" : "border-transparent hover:border-stitch-primary/50"
                                                        }`}
                                                >
                                                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${isFake ? "bg-red-500/20" : isReal ? "bg-green-500/20" : "bg-yellow-500/20"
                                                        }`}>
                                                        <span className={`material-symbols-outlined text-lg ${isFake ? "text-red-400" : isReal ? "text-green-400" : "text-yellow-400"
                                                            }`}>
                                                            {isFake ? "dangerous" : isReal ? "verified" : "help"}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-white font-bold truncate text-sm">{(article.text || "").slice(0, 80)}...</h4>
                                                            <span className={`text-xs font-bold ml-2 shrink-0 px-2 py-0.5 rounded ${isFake ? "text-red-400 bg-red-500/10" : isReal ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                                                                }`}>
                                                                {article.verdict || "PENDING"}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 text-xs line-clamp-2 mt-1">{article.grounded_evidence || article.text?.slice(0, 120)}</p>
                                                        <div className="mt-2 flex items-center gap-3">
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {article.timestamp?.toDate?.()?.toLocaleTimeString() || ""}
                                                            </span>
                                                            {article.red_flags?.length > 0 && (
                                                                <span className="text-[10px] uppercase font-bold bg-red-500/10 px-2 py-0.5 rounded text-red-400">
                                                                    {article.red_flags.length} red flags
                                                                </span>
                                                            )}
                                                            {article.verification_method && (
                                                                <span className="text-[10px] uppercase font-bold bg-bg-dark px-2 py-0.5 rounded text-slate-300">
                                                                    {article.verification_method}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: AI Deep Analysis */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* Truth Gauge (SVG Arc) */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl p-6 flex flex-col items-center">
                                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Truth Probability</h3>
                                <div className="relative size-40 flex items-center justify-center">
                                    <svg className="size-40 -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                                        <circle
                                            cx="50" cy="50" r="42" fill="none"
                                            stroke={confidence > 60 ? "#10b981" : confidence > 40 ? "#f59e0b" : "#ef4444"}
                                            strokeWidth="8"
                                            strokeDasharray="264"
                                            strokeDashoffset={264 - (264 * confidence) / 100}
                                            strokeLinecap="round"
                                            className="drop-shadow-[0_0_10px_rgba(13,204,242,0.6)] transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-bold text-white">{confidence}<span className="text-lg text-accent-cyan">%</span></span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">confidence</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Log */}
                            <div className="bg-card-dark border border-surface-dark rounded-xl flex-1 flex flex-col min-h-[300px]">
                                <div className="px-5 py-4 border-b border-surface-dark flex justify-between items-center bg-surface-dark/20">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Live Analysis Log</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-3 logs-scroll max-h-[300px]">
                                    {articles.slice(0, 7).map((a: any, i: number) => (
                                        <div key={i} className={`flex gap-3 ${i === 0 ? "text-green-400 font-bold border-l-2 border-green-500 pl-2 bg-green-500/5 py-1" : i === 1 ? "text-accent-cyan" : "text-slate-300"} ${i > 3 ? "opacity-50" : ""}`}>
                                            <span className="text-slate-500 w-16 shrink-0">
                                                {a.timestamp?.toDate?.()?.toLocaleTimeString?.()?.slice(0, 5) || "--:--"}
                                            </span>
                                            <span className="truncate">
                                                {i === 0 && "✓ Analysis Complete. "}{a.verdict}: {(a.text || "").slice(0, 50)}...
                                            </span>
                                        </div>
                                    ))}
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
