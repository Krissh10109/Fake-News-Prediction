"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ResultsDisplay from "./results-display"
import { analyzeNews } from "@/app/actions/analyze-news"
import type { PredictResponse } from "@/app/actions/analyze-news"
import { Search, Sparkles, RotateCcw, Shield } from "lucide-react"

export default function NewsVerificationForm() {
  const [newsText, setNewsText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  // E7: frontend timer — purely for display, does not affect verification
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newsText.trim().length === 0) {
      setError("Please paste a headline or article first.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResults(null)
    setElapsedMs(undefined)

    const startTime = Date.now()
    const response = await analyzeNews(newsText)
    const elapsed = Date.now() - startTime

    if (response.success && response.data) {
      setElapsedMs(elapsed)
      setResults(response.data)
    } else {
      setError(response.error || "An error occurred during analysis")
    }

    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setNewsText("")
    setResults(null)
    setError(null)
    setElapsedMs(undefined)
  }

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 text-sm font-medium text-purple-600 dark:text-purple-400">
            <Shield className="w-4 h-4" />
            AI-Powered Fact Verification
          </div>
        </div>

        {/* Description */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🔍 Verifies claims against real sources using Gemini AI + Google Search (~5 seconds)</p>
        </div>

        <div>
          <label htmlFor="news-input" className="block text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Enter News Article
          </label>
          <div className="relative">
            <Textarea
              id="news-input"
              placeholder="Paste a news headline or article to verify its authenticity..."
              className="min-h-[160px] text-base bg-background/50 border-2 border-border/50 focus:border-primary/50 rounded-xl resize-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              disabled={isAnalyzing}
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-primary">
                  <Sparkles className="w-8 h-8 animate-spin-slow" />
                  <span className="font-medium">Verifying with AI...</span>
                  <span className="text-xs text-muted-foreground">Checking facts against real sources</span>
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Tip: Works best with complete headlines or full articles containing specific claims
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            type="submit"
            className="px-8 py-3 text-base font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            disabled={newsText.trim().length === 0 || isAnalyzing}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Analyze
              </span>
            )}
          </Button>

          {results && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="px-6 py-3 text-base font-medium rounded-xl border-2 hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl animate-fadeIn flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1 opacity-80">
              Make sure the backend is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {/* Unified Results Display */}
      {results && <ResultsDisplay results={results} elapsedMs={elapsedMs} />}
    </div>
  )
}
