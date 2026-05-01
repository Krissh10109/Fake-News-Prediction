"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/live-dashboard", label: "Live Dashboard", icon: "stream" },
    { href: "/command-center", label: "Command Center", icon: "radar" },
    { href: "/heatmap", label: "Heatmap Intel", icon: "public" },
    { href: "/forensic-matrix", label: "Forensic Matrix", icon: "hub" },
    { href: "/analysis-report", label: "Analysis Report", icon: "article" },
    { href: "/credibility", label: "Credibility DB", icon: "shield" },
];

export default function DashboardNav() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-surface-darker border-r border-white/5 shrink-0">
            {/* Brand */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
                <span className="material-symbols-outlined text-accent-cyan text-3xl animate-pulse-slow">
                    verified_user
                </span>
                <div>
                    <h1 className="text-white text-lg font-bold tracking-tight uppercase font-display">
                        VeriPulse <span className="text-accent-cyan text-xs font-normal align-top ml-1">AI</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 tracking-[0.15em] uppercase">
                        Truth Intelligence Suite
                    </p>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-neon-cyan"
                                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-accent-cyan" : ""}`}>
                                {link.icon}
                            </span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* System Status */}
            <div className="px-5 py-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    <span className="text-xs font-bold text-green-400 tracking-wider uppercase">System Online</span>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <span>DB Synced</span>
                    <span>AI Active</span>
                </div>
            </div>

            {/* Home Link */}
            <div className="px-3 pb-4">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                    <span className="material-symbols-outlined text-[16px]">home</span>
                    Back to Home
                </Link>
            </div>
        </aside>
    );
}
