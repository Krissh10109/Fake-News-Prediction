"use client"

import { CheckCircle, XCircle, AlertCircle, TrendingUp, Tag, Info, Globe, ExternalLink, FileWarning, Shield, Clock, BarChart2, Cpu, Search } from "lucide-react"
import type { PredictResponse, ClaimAnalysis } from "@/app/actions/analyze-news"

interface ResultsDisplayProps {
  results: PredictResponse
  /** Elapsed verification time in milliseconds (from frontend timer) */
  elapsedMs?: number
}

// ─── E1 + E8: Confidence display helpers ───────────────────────────────────

/** Cap displayed confidence at 99 — purely visual, backend value unchanged. */
function capDisplayConfidence(raw: number): number {
  return Math.min(Math.round(raw), 99)
}

/** E8: Map a displayed confidence value to a human label. */
function confidenceLevelLabel(pct: number): { label: string; color: string } {
  if (pct >= 99) return { label: "Exceptional", color: "text-emerald-600 dark:text-emerald-400" }
  if (pct >= 95) return { label: "Very High",   color: "text-green-600 dark:text-green-400" }
  if (pct >= 90) return { label: "High",         color: "text-green-500 dark:text-green-300" }
  if (pct >= 70) return { label: "Moderate",     color: "text-yellow-600 dark:text-yellow-400" }
  return           { label: "Low",               color: "text-red-500 dark:text-red-400" }
}

// ─── E2 + Polish 1: Source display name helper ─────────────────────────────

/** Hostname → friendly display label (domain-keyed). */
const SOURCE_LABEL_MAP: Record<string, string> = {
  // Google infrastructure
  "vertexaisearch.cloud.google.com": "Google Search",
  "googleapis.com": "Google APIs",
  "google.com": "Google",
  "googleblog.com": "Google Blog",
  // Encyclopaedias / fact-checkers
  "wikipedia.org": "Wikipedia",
  "britannica.com": "Britannica",
  "snopes.com": "Snopes",
  "politifact.com": "PolitiFact",
  "factcheck.org": "FactCheck.org",
  "fullfact.org": "Full Fact",
  "africacheck.org": "Africa Check",
  // Major international news
  "theguardian.com": "The Guardian",
  "bbc.com": "BBC News",
  "bbc.co.uk": "BBC News",
  "reuters.com": "Reuters",
  "apnews.com": "AP News",
  "nytimes.com": "New York Times",
  "washingtonpost.com": "Washington Post",
  "aljazeera.com": "Al Jazeera",
  "bloomberg.com": "Bloomberg",
  "forbes.com": "Forbes",
  "cnn.com": "CNN",
  "foxnews.com": "Fox News",
  "abc.net.au": "ABC News",
  "abc.com": "ABC News",
  "nbcnews.com": "NBC News",
  "cbsnews.com": "CBS News",
  "msnbc.com": "MSNBC",
  "npr.org": "NPR",
  "vox.com": "Vox",
  "theatlantic.com": "The Atlantic",
  "economist.com": "The Economist",
  "ft.com": "Financial Times",
  "wsj.com": "Wall Street Journal",
  "usatoday.com": "USA Today",
  "latimes.com": "Los Angeles Times",
  "time.com": "TIME",
  "newsweek.com": "Newsweek",
  "vice.com": "VICE",
  "buzzfeed.com": "BuzzFeed News",
  "buzzfeednews.com": "BuzzFeed News",
  // Indian news
  "timesofindia.indiatimes.com": "Times of India",
  "hindustantimes.com": "Hindustan Times",
  "ndtv.com": "NDTV",
  "thehindu.com": "The Hindu",
  "indianexpress.com": "Indian Express",
  "indiatoday.in": "India Today",
  "pib.gov.in": "Press Information Bureau",
  "ani.in": "ANI",
  "theprint.in": "The Print",
  "thewire.in": "The Wire",
  // Science / space
  "nasa.gov": "NASA",
  "esa.int": "ESA",
  "space.com": "Space.com",
  "nature.com": "Nature",
  "science.org": "Science",
  "sciencedaily.com": "Science Daily",
  "newscientist.com": "New Scientist",
  "scientificamerican.com": "Scientific American",
  "nationalgeographic.com": "National Geographic",
  "smithsonianmag.com": "Smithsonian",
  "livescience.com": "Live Science",
  "phys.org": "Phys.org",
  "isls.org": "ISLS",
  "ncse.ngo": "National Center for Science Education",
  "noaa.gov": "NOAA",
  "unimelb.edu.au": "University of Melbourne",
  // Health
  "who.int": "WHO",
  "cdc.gov": "CDC",
  "nih.gov": "NIH",
  "mayoclinic.org": "Mayo Clinic",
  "webmd.com": "WebMD",
  "healthline.com": "Healthline",
  "medicalnewstoday.com": "Medical News Today",
  // Tech
  "cnet.com": "CNET",
  "techcrunch.com": "TechCrunch",
  "theverge.com": "The Verge",
  "arstechnica.com": "Ars Technica",
  "wired.com": "Wired",
  "zdnet.com": "ZDNet",
  "engadget.com": "Engadget",
  "gizmodo.com": "Gizmodo",
  "hothardware.com": "HotHardware",
  "tomshardware.com": "Tom's Hardware",
  "anandtech.com": "AnandTech",
  "digitimes.com": "DigiTimes",
  "venturebeat.com": "VentureBeat",
  "9to5mac.com": "9to5Mac",
  "macrumors.com": "MacRumors",
  "appleinsider.com": "AppleInsider",
  "androidauthority.com": "Android Authority",
  "xda-developers.com": "XDA Developers",
  "mentalfloss.com": "Mental Floss",
  // UN / international bodies
  "un.org": "United Nations",
  "imf.org": "IMF",
  "worldbank.org": "World Bank",
  "olympic.org": "IOC",
  "olympics.com": "Olympics.com",
  // Misc
  "reddit.com": "Reddit",
  "twitter.com": "Twitter / X",
  "x.com": "Twitter / X",
  "youtube.com": "YouTube",
  "medium.com": "Medium",
  "substack.com": "Substack",
  "archive.org": "Internet Archive",
  "wolframalpha.com": "Wolfram Alpha",
}

/**
 * Polish 1: acronym / brand exceptions applied to bare base-domain strings.
 * Used when the URL lookup in SOURCE_LABEL_MAP did not match.
 * Maps lowercase base-domain → preferred display brand.
 */
const ACRONYM_FORMAT_MAP: Record<string, string> = {
  nasa: "NASA",
  esa: "ESA",
  nih: "NIH",
  cdc: "CDC",
  noaa: "NOAA",
  isls: "ISLS",
  ncse: "NCSE",
  ndtv: "NDTV",
  cnn: "CNN",
  bbc: "BBC",
  abc: "ABC",
  nbc: "NBC",
  cbs: "CBS",
  pbs: "PBS",
  npr: "NPR",
  ani: "ANI",
  cnet: "CNET",
  zdnet: "ZDNet",
  bfi: "BFI",
  imdb: "IMDb",
  who: "WHO",
  imf: "IMF",
  ioc: "IOC",
  un: "UN",
  eu: "EU",
  nato: "NATO",
  fbi: "FBI",
  cia: "CIA",
  nsa: "NSA",
  // Branded names with non-standard capitalisation
  mentalfloss: "Mental Floss",
  hothardware: "HotHardware",
  anandtech: "AnandTech",
  techcrunch: "TechCrunch",
  venturebeat: "VentureBeat",
  macrumors: "MacRumors",
  appleinsider: "AppleInsider",
  androidauthority: "Android Authority",
  sciencedaily: "Science Daily",
  newscientist: "New Scientist",
  scientificamerican: "Scientific American",
  nationalgeographic: "National Geographic",
  smithsonianmag: "Smithsonian",
  livescience: "Live Science",
  healthline: "Healthline",
  webmd: "WebMD",
  wolframalpha: "Wolfram Alpha",
  phys: "Phys.org",
  arxiv: "arXiv",
}

function getFriendlySourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    // 1. Try the full hostname map first
    for (const [key, label] of Object.entries(SOURCE_LABEL_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return label
    }
    // 2. Extract the base domain word (e.g. 'cnet' from 'cnet.com')
    const parts = hostname.split(".")
    const base = parts.length >= 2 ? parts[parts.length - 2] : hostname
    // 3. Check acronym / brand map (case-insensitive)
    const formatted = ACRONYM_FORMAT_MAP[base.toLowerCase()]
    if (formatted) return formatted
    // 4. Final fallback: title-case
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return url
  }
}

// ─── E3: Deduplicate claims by claim text ──────────────────────────────────

interface MergedClaim {
  claim: string
  status: string          // dominant status
  sources: Array<{ name: string; url: string; date?: string }>
}

function deduplicateClaims(claims: ClaimAnalysis[]): MergedClaim[] {
  const map = new Map<string, MergedClaim>()
  for (const c of claims) {
    const key = (c.claim || "").trim().toLowerCase()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, { claim: c.claim, status: c.status || "unverified", sources: [] })
    }
    const entry = map.get(key)!
    // Prefer stronger statuses
    if (c.status === "confirmed") entry.status = "confirmed"
    else if (c.status === "debunked" && entry.status !== "confirmed") entry.status = "debunked"
    if (c.source) {
      entry.sources.push({ name: c.source, url: c.url || "", date: c.date })
    }
  }
  return Array.from(map.values())
}

// ─── E5: Evidence statistics ────────────────────────────────────────────────

function getEvidenceStats(claims: ClaimAnalysis[]) {
  const supporting    = claims.filter(c => (c.status || "").toLowerCase() === "confirmed").length
  const contradicting = claims.filter(c => (c.status || "").toLowerCase() === "debunked").length
  const unverified    = claims.length - supporting - contradicting
  return { supporting, contradicting, unverified, total: claims.length }
}

// ─── Claim status icon ──────────────────────────────────────────────────────

function ClaimStatusIcon({ status }: { status: string }) {
  const s = (status || "").toLowerCase()
  if (s === "confirmed") return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
  if (s === "debunked")  return <XCircle     className="h-4 w-4 text-red-500   flex-shrink-0" />
  return                        <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
}

// ─── Circular Confidence Gauge ──────────────────────────────────────────────

function ConfidenceGauge({ confidence, label }: { confidence: number; label: string }) {
  // E1: cap at 99 for display; backend value is never mutated
  const displayed    = capDisplayConfidence(confidence)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (displayed / 100) * circumference

  const getColorClass = () => {
    if (label === "REAL") return "gauge-fill real"
    if (label === "FAKE") return "gauge-fill fake"
    return "gauge-fill verify"
  }

  // E8: confidence level label
  const { label: levelLabel, color: levelColor } = confidenceLevelLabel(displayed)

  return (
    <div className="gauge-container mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle className="gauge-bg" cx="50" cy="50" r="45" />
        <circle
          className={`${getColorClass()} animate-progress-fill`}
          cx="50" cy="50" r="45"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{displayed}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</span>
        {/* E8: level label below the gauge */}
        <span className={`text-[10px] font-semibold mt-0.5 uppercase tracking-wide ${levelColor}`}>
          {levelLabel}
        </span>
      </div>
    </div>
  )
}

// ─── E6: Richer explanation templates ──────────────────────────────────────

function buildFallbackExplanation(label: string): string {
  if (label === "REAL")
    return "Multiple independent sources support this claim and no significant contradictory evidence was found."
  if (label === "FAKE")
    return "Multiple authoritative sources contradict this claim or fail to support it, indicating a high likelihood of misinformation."
  return "The available evidence is insufficient or conflicting. Manual fact-checking through trusted sources is strongly advised."
}

// ─── E7: Format elapsed time ────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  return (ms / 1000).toFixed(1) + "s"
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ResultsDisplay({ results, elapsedMs }: ResultsDisplayProps) {
  const {
    label, confidence, explanation_keywords, source_credibility,
    evidence_summary, sources, claims_analysis, red_flags,
    verification_method, note,
  } = results

  const isAIVerified = verification_method === "gemini_grounding"

  // E1: cap display value
  const displayedConfidence = capDisplayConfidence(confidence)
  // E8: level label
  const { label: levelLabel, color: levelColor } = confidenceLevelLabel(displayedConfidence)

  const getTone = () => {
    if (label === "NEEDS VERIFICATION" || label === "NEEDS_VERIFICATION") {
      return {
        text: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-800",
        icon: AlertCircle,
        cardClass: "result-card verify",
        pillClass: "keyword-pill verify",
        gradient: "from-orange-500 to-amber-500",
        displayLabel: "NEEDS VERIFICATION",
      }
    }
    if (label === "REAL") {
      return {
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        icon: CheckCircle,
        cardClass: "result-card real",
        pillClass: "keyword-pill real",
        gradient: "from-green-500 to-emerald-500",
        displayLabel: "REAL",
      }
    }
    return {
      text: "text-red-500 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: XCircle,
      cardClass: "result-card fake",
      pillClass: "keyword-pill fake",
      gradient: "from-red-500 to-rose-500",
      displayLabel: "FAKE",
    }
  }

  const tone = getTone()
  const Icon = tone.icon

  // E3: deduplicated claims
  const mergedClaims = claims_analysis && claims_analysis.length > 0
    ? deduplicateClaims(claims_analysis)
    : []

  // E5: evidence statistics
  const stats = claims_analysis && claims_analysis.length > 0
    ? getEvidenceStats(claims_analysis)
    : null

  // E2: deduplicated display sources
  const uniqueSources: Array<{ url: string; name: string }> = []
  const seenLabels = new Set<string>()
  for (const src of (sources || [])) {
    const name = getFriendlySourceName(src)
    if (!seenLabels.has(name)) {
      seenLabels.add(name)
      uniqueSources.push({ url: src, name })
    }
  }

  return (
    <div className={`mt-8 ${tone.cardClass} glass-card p-6 md:p-8 animate-fadeInScale`}>

      {/* ── Top badges row ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        {/* Verification method pill */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isAIVerified
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
          {isAIVerified ? <Shield className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isAIVerified ? "AI Verified" : "Pattern Analysis Only"}
        </span>

        {/* E7: Verification time */}
        {elapsedMs !== undefined && elapsedMs > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            Verified in {formatElapsed(elapsedMs)}
          </span>
        )}

        {/* E8: Confidence level label */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 ${levelColor}`}>
          <BarChart2 className="w-3 h-3" />
          {levelLabel} Confidence
        </span>
      </div>

      {/* ── Main Result Header ── */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        {/* Confidence Gauge — E1 cap happens inside */}
        <ConfidenceGauge confidence={confidence} label={label} />

        {/* Label and Description */}
        <div className="flex-1 text-center md:text-left">
          <div className={`flex items-center justify-center md:justify-start gap-3 ${tone.text}`}>
            <Icon className="h-8 w-8" />
            <span className="text-3xl md:text-4xl font-bold uppercase tracking-wide">
              {tone.displayLabel}
            </span>
          </div>

          {/* E6: richer explanation */}
          <p className="mt-3 text-muted-foreground max-w-lg text-sm leading-relaxed">
            {evidence_summary || buildFallbackExplanation(label)}
          </p>

          {/* E5: inline evidence stats under description */}
          {stats && stats.total > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 justify-center md:justify-start">
              {stats.supporting > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Supporting Sources: {stats.supporting}
                </span>
              )}
              {stats.contradicting > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle className="w-3 h-3" />
                  Contradictory Sources: {stats.contradicting}
                </span>
              )}
              {stats.unverified > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <AlertCircle className="w-3 h-3" />
                  Unverified: {stats.unverified}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── E4: Verification Method Card ── */}
      <div className="mb-6 p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/20">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-300 uppercase tracking-wide">
            Verification Method
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAIVerified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Gemini 2.5 Flash Grounding
            </span>
          )}
          {isAIVerified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Multi-Source Verification
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            ML Pattern Analysis
          </span>
          {!isAIVerified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
              <Search className="w-3.5 h-3.5" />
              Wikipedia Fact-Check
            </span>
          )}
        </div>
      </div>

      {/* ── E3: Deduplicated Claims Analysis ── */}
      {mergedClaims.length > 0 && (
        <div className="mb-6 p-5 rounded-xl bg-card border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Claims Verified by AI</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {mergedClaims.length} claim{mergedClaims.length !== 1 ? "s" : ""} checked
            </span>
          </div>
          <div className="space-y-4">
            {mergedClaims.map((claim, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <ClaimStatusIcon status={claim.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{claim.claim}</p>
                    <span className={`text-xs font-medium capitalize mt-0.5 inline-block ${
                      claim.status === "confirmed" ? "text-green-600 dark:text-green-400"
                      : claim.status === "debunked"  ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {claim.status}
                    </span>

                    {/* E3: grouped sources under each claim */}
                    {claim.sources.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Supporting Sources:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {claim.sources.map((src, si) => (
                            <span key={si} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-background border">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {src.url && src.url.startsWith("http") ? (
                                <a href={src.url} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline">
                                  {src.name}
                                </a>
                              ) : (
                                <span>{src.name}</span>
                              )}
                              {src.date && <span className="text-muted-foreground">· {src.date}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Red Flags ── */}
      {red_flags && red_flags.length > 0 && (
        <div className="mb-6 p-5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Red Flags</h3>
            <span className="ml-auto text-xs text-muted-foreground">{red_flags.length} found</span>
          </div>
          <ul className="space-y-2">
            {red_flags.map((flag: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── E2: Grounding Sources (deduplicated, friendly names) ── */}
      {uniqueSources.length > 0 && (
        <div className="mb-6 p-5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Grounding Sources</h3>
            <span className="ml-auto text-xs text-muted-foreground">{uniqueSources.length} source{uniqueSources.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueSources.map((src, index) => (
              <a
                key={index}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors font-medium"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {src.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Details Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Credibility */}
        <div className={`p-5 rounded-xl ${tone.bg} ${tone.border} border`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Source Credibility</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score</span>
              {/* E1: cap credibility display at 99% as well */}
              <span className="font-bold text-lg">
                {Math.min(Math.round(source_credibility.score * 100), 99)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tone.gradient} transition-all duration-1000`}
                style={{ width: `${Math.min(source_credibility.score * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Indicators */}
        <div className={`p-5 rounded-xl ${tone.bg} ${tone.border} border`}>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Key Indicators</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {explanation_keywords.length > 0 ? (
              explanation_keywords.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className={`${tone.pillClass} animate-fadeIn`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">No specific keywords identified</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-start gap-3 text-muted-foreground">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p>
              <span className="font-medium text-foreground">
                {isAIVerified ? "AI-Powered Verification:" : "Disclaimer:"}
              </span>{" "}
              {note || "Always verify important news through multiple trusted sources."}
            </p>
            {(label === "NEEDS VERIFICATION" || label === "NEEDS_VERIFICATION") && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ This article requires manual fact-checking before drawing conclusions.
              </span>
            )}
            {verification_method && (
              <span className="block mt-1 text-xs">Engine: {verification_method}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
