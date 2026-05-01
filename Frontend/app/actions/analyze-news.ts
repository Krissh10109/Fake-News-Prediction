"use server"

const defaultBackend = "http://localhost:8000"

export type ClaimAnalysis = {
  claim: string
  status: string
  source: string
  url: string
  date?: string
}

export type PredictResponse = {
  prediction: string
  confidence: number
  reliability: string
  label: string
  explanation_keywords: string[]
  model_version: string
  // AI evidence & sources
  evidence_summary: string
  sources: string[]
  claims_analysis: ClaimAnalysis[]
  red_flags: string[]
  // Source credibility
  source_credibility: {
    score: number
    factors: string
  }
  // Metadata
  verification_method: string
  note: string
}

export async function analyzeNews(newsText: string) {
  // IMPORTANT: Do not mutate user input (no trimming/lowercasing/etc).
  // Backend is responsible for all preprocessing.
  if (newsText.trim().length === 0) {
    return { success: false, error: "Please paste a headline or article first." }
  }

  const backendUrl = (process.env.BACKEND_URL || defaultBackend).replace(/\/$/, "")

  try {
    const response = await fetch(`${backendUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newsText }),
      cache: "no-store",
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Backend responded with ${response.status}: ${detail}`)
    }

    const result = (await response.json()) as PredictResponse

    return {
      success: true,
      // Single source of truth: pass backend result through unchanged.
      data: result,
    }
  } catch (error) {
    console.error("[analyzeNews] Error:", error)
    return {
      success: false,
      error: "Could not reach the detection backend. Is it running?",
    }
  }
}
