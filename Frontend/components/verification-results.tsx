"use client"

import { CheckCircle, XCircle, AlertCircle, Shield, AlertTriangle, Info, BookOpen, Scale, FileWarning, Globe, ExternalLink, Newspaper } from "lucide-react"

// Types for verification response
interface ClaimAnalysis {
    claim: string
    claim_type?: string
    status?: string
    verification_status?: string
    confidence_score?: number
    reasoning?: string
    source?: string
    url?: string
}

interface RedFlag {
    type?: string
    severity?: string
    description?: string
    evidence?: string
}

interface LinguisticAnalysis {
    emotional_manipulation_score: number
    clickbait_indicators: number
    source_citation_quality: number
    writing_professionalism: number
    headline_body_consistency: number
}

interface WebVerificationSource {
    source: string
    title: string
    url: string
    snippet?: string
    found?: boolean
}

interface RedditResult {
    source: string
    title: string
    url: string
    snippet?: string
    subreddit?: string
    score?: number
}

interface GoogleNewsResult {
    source: string
    title: string
    url: string
    published?: string
}

interface FactCheckResult {
    source: string
    snippet: string
    url: string
}

interface WebVerification {
    searches_performed: number
    sources_found: WebVerificationSource[]
    corroboration_level: string
    consensus_score?: number
    fact_check_results: FactCheckResult[]
    news_coverage: WebVerificationSource[]
    wikipedia_result?: WebVerificationSource
    reddit_results?: RedditResult[]
    google_news_results?: GoogleNewsResult[]
}

interface VerificationResponse {
    article_metadata?: {
        headline: string
        source: string
        publication_date: string
    }
    overall_assessment: {
        credibility_score: number
        recommendation: string
        confidence_level: string
    }
    claims_analysis: ClaimAnalysis[]
    red_flags: (string | RedFlag)[]
    linguistic_analysis?: LinguisticAnalysis
    web_verification?: WebVerification
    evidence_summary: string
    grounded_evidence?: Array<{
        claim: string
        status: string
        source: string
        url: string
    }>
    ml_analysis?: {
        prediction: string
        confidence: number
        explanation_keywords?: string[]
        is_extreme_claim?: boolean
    }
    verification_method?: string
    recommendations?: {
        user_action: string
        additional_verification_needed: boolean
        areas_of_uncertainty: string[]
    }
    model_used?: string
    error?: boolean
    message?: string
}

interface VerificationResultsProps {
    results: VerificationResponse
}

// Score bar component
function ScoreBar({ score, max = 10, label }: { score: number; max?: number; label: string }) {
    const percentage = (score / max) * 100
    const getColor = () => {
        if (percentage >= 70) return "bg-green-500"
        if (percentage >= 40) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{score}/{max}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

// Claim status icon
function ClaimStatusIcon({ status }: { status: string }) {
    switch (status) {
        case "confirmed":
            return <CheckCircle className="h-5 w-5 text-green-500" />
        case "contradicted":
            return <XCircle className="h-5 w-5 text-red-500" />
        default:
            return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
}

// Severity badge
function SeverityBadge({ severity }: { severity: string }) {
    const colors = {
        critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors] || colors.low}`}>
            {severity.toUpperCase()}
        </span>
    )
}

export default function VerificationResults({ results }: VerificationResultsProps) {
    // Handle error state
    if (results.error) {
        return (
            <div className="mt-8 p-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                    <h3 className="font-semibold">Verification Failed</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{results.message}</p>
            </div>
        )
    }

    const { overall_assessment, claims_analysis, red_flags, linguistic_analysis, web_verification, evidence_summary, recommendations } = results

    // Determine overall tone
    const getTone = () => {
        const rec = (overall_assessment.recommendation || "").toLowerCase()
        if (rec.includes("real") || rec.includes("true") || rec.includes("confirmed")) return {
            icon: CheckCircle,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-950/30",
            border: "border-green-200 dark:border-green-800",
            label: "LIKELY REAL"
        }
        if (rec.includes("fake") || rec.includes("false") || rec.includes("misleading")) return {
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/30",
            border: "border-red-200 dark:border-red-800",
            label: "LIKELY FAKE"
        }
        if (rec.includes("satire")) return {
            icon: BookOpen,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-950/30",
            border: "border-purple-200 dark:border-purple-800",
            label: "SATIRE"
        }
        return {
            icon: AlertCircle,
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-950/30",
            border: "border-orange-200 dark:border-orange-800",
            label: rec.includes("unverif") ? "UNVERIFIABLE" : "NEEDS VERIFICATION"
        }
    }

    const tone = getTone()
    const Icon = tone.icon

    return (
        <div className="mt-8 space-y-6 animate-fadeIn">
            {/* Overall Assessment Card */}
            <div className={`p-6 rounded-xl ${tone.bg} ${tone.border} border glass-card`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Credibility Score */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-muted/30"
                            />
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={2 * Math.PI * 45 * (1 - overall_assessment.credibility_score / 100)}
                                strokeLinecap="round"
                                className={tone.color}
                                style={{ transition: "stroke-dashoffset 1s ease-out" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">{overall_assessment.credibility_score}</span>
                            <span className="text-xs text-muted-foreground uppercase">Score</span>
                        </div>
                    </div>

                    {/* Assessment Details */}
                    <div className="flex-1 text-center md:text-left">
                        <div className={`flex items-center justify-center md:justify-start gap-3 ${tone.color}`}>
                            <Icon className="h-8 w-8" />
                            <span className="text-2xl md:text-3xl font-bold">{tone.label}</span>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                            Confidence: <span className="font-medium capitalize">{overall_assessment.confidence_level}</span>
                        </p>
                        <p className="mt-3 text-sm">{evidence_summary}</p>
                    </div>
                </div>
            </div>

            {/* Web Verification Section */}
            {web_verification && web_verification.searches_performed > 0 && (
                <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">Web Verification</h3>
                        <span className="ml-auto text-sm text-muted-foreground">
                            {web_verification.searches_performed} searches performed
                        </span>
                    </div>

                    {/* Corroboration Level */}
                    <div className="mb-4 p-3 rounded-lg bg-background/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Corroboration Level</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${web_verification.corroboration_level === 'strong' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                web_verification.corroboration_level === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    web_verification.corroboration_level === 'contradicted' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                {web_verification.corroboration_level === 'contradicted' ? '⚠️ Contradicted' : web_verification.corroboration_level}
                            </span>
                        </div>
                    </div>

                    {/* Sources Found */}
                    {web_verification.sources_found && web_verification.sources_found.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Sources Found ({web_verification.sources_found.length})
                            </h4>
                            <div className="space-y-2">
                                {web_verification.sources_found.map((source, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-background border text-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{source.source}</p>
                                                <p className="text-muted-foreground">{source.title}</p>
                                                {source.snippet && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.snippet}</p>
                                                )}
                                            </div>
                                            {source.url && (
                                                <a href={source.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fact-Checker Results */}
                    {web_verification.fact_check_results && web_verification.fact_check_results.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                Fact-Checker Results ({web_verification.fact_check_results.length})
                            </h4>
                            <div className="space-y-2">
                                {web_verification.fact_check_results.map((fc, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-sm">
                                        <p className="font-medium">{fc.source}</p>
                                        <p className="text-muted-foreground mt-1">{fc.snippet}</p>
                                        {fc.url && (
                                            <a href={fc.url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                                View full fact-check →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* News Coverage */}
                    {web_verification.news_coverage && web_verification.news_coverage.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <Newspaper className="h-4 w-4 text-gray-600" />
                                News Coverage ({web_verification.news_coverage.length})
                            </h4>
                            <div className="space-y-2">
                                {web_verification.news_coverage.slice(0, 3).map((news, idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-background border text-sm">
                                        <p className="font-medium line-clamp-1">{news.title}</p>
                                        {news.url && (
                                            <a href={news.url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline">
                                                {news.source}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reddit Results */}
                    {web_verification.reddit_results && web_verification.reddit_results.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <span className="text-lg">🔵</span>
                                Reddit Discussions ({web_verification.reddit_results.length})
                            </h4>
                            <div className="space-y-2">
                                {web_verification.reddit_results.map((post, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-background border text-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium line-clamp-1">{post.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    {post.subreddit && <span className="font-medium text-blue-600">{post.subreddit}</span>}
                                                    {post.score !== undefined && <span>⬆️ {post.score}</span>}
                                                </div>
                                                {post.snippet && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.snippet}</p>
                                                )}
                                            </div>
                                            {post.url && (
                                                <a href={post.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Google News Results */}
                    {web_verification.google_news_results && web_verification.google_news_results.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <span className="text-lg">📰</span>
                                Google News ({web_verification.google_news_results.length})
                            </h4>
                            <div className="space-y-2">
                                {web_verification.google_news_results.map((news, idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-background border text-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium line-clamp-1">{news.title}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span className="font-medium">{news.source}</span>
                                                    {news.published && <span>• {news.published}</span>}
                                                </div>
                                            </div>
                                            {news.url && (
                                                <a href={news.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No results warning */}
                    {(!web_verification.sources_found || web_verification.sources_found.length === 0) &&
                        (!web_verification.fact_check_results || web_verification.fact_check_results.length === 0) &&
                        (!web_verification.news_coverage || web_verification.news_coverage.length === 0) &&
                        (!web_verification.reddit_results || web_verification.reddit_results.length === 0) &&
                        (!web_verification.google_news_results || web_verification.google_news_results.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No external sources found for verification</p>
                                <p className="text-sm">This could indicate the claim is unverified or fabricated</p>
                            </div>
                        )}
                </div>
            )}

            {/* Claims Analysis */}
            {claims_analysis && claims_analysis.length > 0 && (
                <div className="p-6 rounded-xl bg-card border glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Scale className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">Claims Analysis</h3>
                    </div>
                    <div className="space-y-3">
                        {claims_analysis.map((claim, index) => (
                            <div key={index} className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-start gap-3">
                                    <ClaimStatusIcon status={claim.verification_status} />
                                    <div className="flex-1">
                                        <p className="font-medium">{claim.claim}</p>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <span className="capitalize">{claim.claim_type}</span>
                                            <span>•</span>
                                            <span className="capitalize">{claim.verification_status}</span>
                                            <span>•</span>
                                            <span>{claim.confidence_score}% confident</span>
                                        </div>
                                        {claim.reasoning && (
                                            <p className="mt-2 text-sm text-muted-foreground italic">{claim.reasoning}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Red Flags */}
            {red_flags && red_flags.length > 0 && (
                <div className="p-6 rounded-xl bg-card border glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <FileWarning className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-lg">Red Flags Detected</h3>
                        <span className="ml-auto text-sm text-muted-foreground">{red_flags.length} found</span>
                    </div>
                    <div className="space-y-3">
                        {red_flags.map((flag, index) => {
                            // Handle both string and object red flags
                            if (typeof flag === 'string') {
                                return (
                                    <div key={index} className="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                        <p className="font-medium">{flag}</p>
                                    </div>
                                )
                            }
                            return (
                                <div key={index} className="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {flag.severity && <SeverityBadge severity={flag.severity} />}
                                                {flag.type && <span className="text-xs text-muted-foreground uppercase">{flag.type}</span>}
                                            </div>
                                            <p className="mt-2 font-medium">{flag.description}</p>
                                            {flag.evidence && (
                                                <p className="mt-1 text-sm text-muted-foreground">"{flag.evidence}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Linguistic Analysis */}
            {linguistic_analysis && (
                <div className="p-6 rounded-xl bg-card border glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">Writing Analysis</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ScoreBar score={linguistic_analysis.writing_professionalism} label="Writing Quality" />
                        <ScoreBar score={linguistic_analysis.source_citation_quality} label="Source Citations" />
                        <ScoreBar score={linguistic_analysis.headline_body_consistency} label="Headline Consistency" />
                        <ScoreBar score={10 - linguistic_analysis.emotional_manipulation_score} label="Objectivity" />
                        <ScoreBar score={10 - linguistic_analysis.clickbait_indicators} label="Non-Clickbait" />
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {recommendations && (
                <div className="p-6 rounded-xl bg-card border glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">Recommendations</h3>
                    </div>
                    <p className="text-muted-foreground">{recommendations.user_action}</p>
                    {recommendations.areas_of_uncertainty && recommendations.areas_of_uncertainty.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Areas of Uncertainty:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {recommendations.areas_of_uncertainty.map((area, index) => (
                                    <li key={index}>{area}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Disclaimer */}
            <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-3 text-muted-foreground">
                    <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                        <span className="font-medium text-foreground">Multi-Source Verification:</span> This analysis combines ML predictions,
                        web searches (Wikipedia, Reddit, Google News), and fact-checker databases.
                        Results should be treated as guidance, not absolute truth.
                        {results.model_used && <span className="block mt-1 text-xs">Method: {results.model_used}</span>}
                        {results.verification_method && <span className="block mt-1 text-xs">Engine: {results.verification_method}</span>}
                    </p>
                </div>
            </div>
        </div>
    )
}
