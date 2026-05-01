import { CheckCircle, XCircle, AlertCircle, TrendingUp, Tag, Info, Globe, ExternalLink, FileWarning, Shield } from "lucide-react"
import type { PredictResponse, ClaimAnalysis } from "@/app/actions/analyze-news"

interface ResultsDisplayProps {
  results: PredictResponse
}

// Circular Progress Gauge Component
function ConfidenceGauge({ confidence, label }: { confidence: number; label: string }) {
  // Backend already sends confidence as percentage (0-100)
  const percentage = Math.round(confidence)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColorClass = () => {
    if (label === "REAL") return "gauge-fill real"
    if (label === "FAKE") return "gauge-fill fake"
    return "gauge-fill verify"
  }

  return (
    <div className="gauge-container mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background circle */}
        <circle
          className="gauge-bg"
          cx="50"
          cy="50"
          r="45"
        />
        {/* Progress circle */}
        <circle
          className={`${getColorClass()} animate-progress-fill`}
          cx="50"
          cy="50"
          r="45"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-out'
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</span>
      </div>
    </div>
  )
}

// Claim status icon
function ClaimStatusIcon({ status }: { status: string }) {
  const s = (status || "").toLowerCase()
  if (s === "confirmed" || s === "debunked") {
    return s === "confirmed"
      ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
  }
  return <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const { label, confidence, explanation_keywords, source_credibility, evidence_summary, sources, claims_analysis, red_flags, verification_method, note } = results

  const isAIVerified = verification_method === "gemini_grounding"

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
        displayLabel: "NEEDS VERIFICATION"
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
        displayLabel: "REAL"
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
      displayLabel: "FAKE"
    }
  }

  const tone = getTone()
  const Icon = tone.icon

  return (
    <div className={`mt-8 ${tone.cardClass} glass-card p-6 md:p-8 animate-fadeInScale`}>
      {/* Verification Method Badge */}
      <div className="flex justify-center mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isAIVerified
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
          {isAIVerified ? <Shield className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isAIVerified ? "AI Verified" : "Pattern Analysis Only"}
        </span>
      </div>

      {/* Main Result Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        {/* Confidence Gauge */}
        <ConfidenceGauge confidence={confidence} label={label} />

        {/* Label and Description */}
        <div className="flex-1 text-center md:text-left">
          <div className={`flex items-center justify-center md:justify-start gap-3 ${tone.text}`}>
            <Icon className="h-8 w-8" />
            <span className="text-3xl md:text-4xl font-bold uppercase tracking-wide">
              {tone.displayLabel}
            </span>
          </div>
          {evidence_summary ? (
            <p className="mt-3 text-muted-foreground max-w-lg text-sm leading-relaxed">
              {evidence_summary}
            </p>
          ) : (
            <p className="mt-3 text-muted-foreground max-w-md">
              {label === "REAL" && "This article appears to be from a credible source with factual content."}
              {label === "FAKE" && "This article shows patterns commonly associated with misinformation."}
              {(label === "NEEDS VERIFICATION" || label === "NEEDS_VERIFICATION") && "This article contains claims that require manual fact-checking."}
            </p>
          )}
        </div>
      </div>

      {/* Claims Analysis (AI Evidence) */}
      {claims_analysis && claims_analysis.length > 0 && (
        <div className="mb-6 p-5 rounded-xl bg-card border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Claims Verified by AI</h3>
            <span className="ml-auto text-xs text-muted-foreground">{claims_analysis.length} claims checked</span>
          </div>
          <div className="space-y-3">
            {claims_analysis.map((claim: ClaimAnalysis, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                <ClaimStatusIcon status={claim.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{claim.claim}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className={`capitalize font-medium ${claim.status === "confirmed" ? "text-green-600 dark:text-green-400" :
                      claim.status === "debunked" ? "text-red-600 dark:text-red-400" :
                        "text-yellow-600 dark:text-yellow-400"
                      }`}>
                      {claim.status}
                    </span>
                    {claim.source && (
                      <>
                        <span>•</span>
                        <span>{claim.source}</span>
                      </>
                    )}
                    {claim.date && (
                      <>
                        <span>•</span>
                        <span>{claim.date}</span>
                      </>
                    )}
                  </div>
                  {claim.url && claim.url.startsWith("http") && (
                    <a href={claim.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                      View source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
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

      {/* Grounding Sources */}
      {sources && sources.length > 0 && (
        <div className="mb-6 p-5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Sources</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((src: string, index: number) => (
              <a
                key={index}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors truncate max-w-[300px]"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {(() => {
                  try {
                    return new URL(src).hostname.replace("www.", "")
                  } catch {
                    return src
                  }
                })()}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Details Grid */}
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
              <span className="font-bold text-lg">{(source_credibility.score * 100).toFixed(0)}%</span>
            </div>
            {/* Credibility bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tone.gradient} transition-all duration-1000`}
                style={{ width: `${Math.min(source_credibility.score * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explanation Keywords */}
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

      {/* Disclaimer */}
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
