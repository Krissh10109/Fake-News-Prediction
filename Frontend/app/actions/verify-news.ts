"use server"

const defaultBackend = "http://localhost:8000"

export type VerifyResponse = {
    overall_assessment: {
        credibility_score: number
        recommendation: string
        confidence_level: string
    }
    claims_analysis: Array<{
        claim: string
        claim_type?: string
        status?: string
        verification_status?: string
        confidence_score?: number
        reasoning?: string
        source?: string
        url?: string
        date?: string
    }>
    red_flags: Array<
        | string
        | {
            type: string
            severity: string
            description: string
            evidence: string
        }
    >
    linguistic_analysis?: {
        emotional_manipulation_score: number
        clickbait_indicators: number
        source_citation_quality: number
        writing_professionalism: number
        headline_body_consistency: number
    }
    web_verification?: {
        searches_performed: number
        sources_found: Array<{
            source: string
            title: string
            url: string
            snippet?: string
            found?: boolean
        }>
        corroboration_level: string
        fact_check_results: Array<{
            source: string
            snippet: string
            url: string
        }>
        news_coverage: Array<{
            source: string
            title: string
            url: string
            snippet?: string
        }>
        wikipedia_result?: {
            source: string
            title: string
            url: string
            snippet?: string
        }
        reddit_results?: Array<{
            source: string
            title: string
            url: string
            snippet?: string
            subreddit?: string
            score?: number
        }>
        google_news_results?: Array<{
            source: string
            title: string
            url: string
            published?: string
        }>
    }
    grounded_evidence?: Array<{
        claim: string
        status: string
        source: string
        url: string
        date?: string
    }>
    grounding_sources?: string[]
    evidence_summary: string
    ml_analysis?: {
        prediction: string
        confidence: number
        explanation_keywords?: string[]
        is_extreme_claim?: boolean
        label?: string
    }
    verification_method?: string
    model_used?: string
    error?: boolean
    message?: string
}

export async function verifyNews(newsText: string) {
    if (newsText.trim().length < 20) {
        return {
            success: false,
            error: "Text must be at least 20 characters for deep verification.",
        }
    }

    const backendUrl = (
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        defaultBackend
    ).replace(/\/$/, "")

    try {
        const response = await fetch(`${backendUrl}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newsText }),
            cache: "no-store",
        })

        if (!response.ok) {
            const detail = await response.text()
            throw new Error(
                `Backend responded with ${response.status}: ${detail}`
            )
        }

        const result = (await response.json()) as VerifyResponse

        if (result.error) {
            return {
                success: false,
                error: result.message || "Verification failed",
            }
        }

        return {
            success: true,
            data: result,
        }
    } catch (error) {
        console.error("[verifyNews] Error:", error)
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Could not reach the verification backend. Is it running?",
        }
    }
}
