"""
Multi-Source Verification Engine
================================
Queries multiple free web sources to verify news claims:
  1. Wikipedia — Full content extraction via API
  2. Reddit   — JSON search API (no API key needed)
  3. Google News — RSS feed scraping (free, no key)
  4. DuckDuckGo — Instant Answer API (free, no key)
  5. Fact-Checkers — Snopes, PolitiFact, FactCheck.org via DuckDuckGo

All sources are free and require NO API keys.

Usage:
    from multi_source_verifier import MultiSourceVerifier
    verifier = MultiSourceVerifier()
    results = verifier.verify_claim("Biden signs executive order on AI")
"""

import re
import time
import logging
from typing import Dict, List, Any, Optional
from urllib.parse import quote_plus
import requests

logger = logging.getLogger(__name__)

# Shared HTTP session for connection reuse
_session = requests.Session()
_session.headers.update({
    "User-Agent": "VeriPulse/2.0 (AcademicProject; news-verification)",
    "Accept": "application/json",
})

# --- Domain authority tiers ---
AUTHORITY_TIERS = {
    "tier1": {
        "domains": [
            "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
            "nytimes.com", "washingtonpost.com", "theguardian.com",
            "npr.org", "pbs.org", "who.int", "un.org",
        ],
        "weight": 1.0,
        "label": "Major Wire / Official",
    },
    "tier2": {
        "domains": [
            "cnn.com", "nbcnews.com", "cbsnews.com", "abcnews.go.com",
            "foxnews.com", "ndtv.com", "thehindu.com", "aljazeera.com",
            "france24.com", "dw.com", "politico.com", "economist.com",
        ],
        "weight": 0.85,
        "label": "Major National",
    },
    "tier3": {
        "domains": [
            "snopes.com", "factcheck.org", "politifact.com",
            "fullfact.org", "boomlive.in",
        ],
        "weight": 0.95,
        "label": "Fact-Checker",
    },
}

UNRELIABLE_DOMAINS = [
    "infowars.com", "naturalnews.com", "beforeitsnews.com",
    "worldnewsdailyreport.com", "theonion.com", "babylonbee.com",
]


def _domain_authority(url: str) -> float:
    """Score a URL's domain authority 0.0–1.0."""
    url_lower = url.lower()
    for tier in AUTHORITY_TIERS.values():
        for domain in tier["domains"]:
            if domain in url_lower:
                return tier["weight"]
    for domain in UNRELIABLE_DOMAINS:
        if domain in url_lower:
            return 0.1
    return 0.5  # unknown domain


class MultiSourceVerifier:
    """Query multiple free sources to verify a news claim."""

    def __init__(self, timeout: int = 6):
        self.timeout = timeout

    # ==================================================================
    # Public interface
    # ==================================================================
    def verify_claim(self, headline: str, body: str = "") -> Dict[str, Any]:
        """
        Run all verification sources and return consolidated results.

        Args:
            headline: News headline or claim to verify
            body: Optional article body for context

        Returns:
            Dict with per-source results, consensus score, and corroboration level.
        """
        search_query = self._extract_search_terms(headline)
        if not search_query:
            return self._empty_result()

        logger.info(f"Multi-source verification: '{search_query}'")

        # Run all sources (sequential to respect rate limits)
        wiki_result = self._search_wikipedia(search_query)
        reddit_results = self._search_reddit(search_query)
        gnews_results = self._search_google_news(search_query)
        ddg_results = self._search_duckduckgo(search_query)
        factcheck_results = self._search_fact_checkers(search_query)

        # Collect all sources
        all_sources = []
        if wiki_result:
            all_sources.append(wiki_result)
        all_sources.extend(reddit_results)
        all_sources.extend(gnews_results)
        all_sources.extend(ddg_results)

        # Count searches
        searches_performed = (
            (1 if wiki_result else 0)
            + len(reddit_results)
            + len(gnews_results)
            + len(ddg_results)
            + len(factcheck_results)
        )

        # Assess corroboration
        corroboration = self._assess_corroboration(
            wiki_result, reddit_results, gnews_results,
            ddg_results, factcheck_results, headline
        )

        result = {
            "searches_performed": searches_performed,
            "sources_found": all_sources,
            "corroboration_level": corroboration["level"],
            "consensus_score": corroboration["score"],
            "fact_check_results": factcheck_results,
            "news_coverage": gnews_results + ddg_results,
            "wikipedia_result": wiki_result,
            "reddit_results": reddit_results,
            "google_news_results": gnews_results,
        }

        logger.info(
            f"Multi-source done: {searches_performed} searches, "
            f"corroboration={corroboration['level']} "
            f"(score={corroboration['score']})"
        )
        return result

    # ==================================================================
    # 1. Wikipedia (full content extraction)
    # ==================================================================
    def _search_wikipedia(self, query: str) -> Optional[Dict[str, Any]]:
        """Search Wikipedia and extract a summary snippet."""
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": 3,
                "srprop": "snippet|titlesnippet",
            }
            resp = _session.get(url, params=params, timeout=self.timeout)
            data = resp.json()

            results = data.get("query", {}).get("search", [])
            if not results:
                return None

            best = results[0]
            snippet = re.sub(r"<[^>]+>", "", best.get("snippet", ""))
            title = best["title"]

            # Try to get first paragraph via TextExtracts
            extract = self._get_wikipedia_extract(title)

            return {
                "source": "Wikipedia",
                "title": title,
                "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                "snippet": extract or snippet[:300],
                "found": True,
            }
        except Exception as e:
            logger.warning(f"Wikipedia search error: {e}")
            return None

    def _get_wikipedia_extract(self, title: str) -> Optional[str]:
        """Get the lead paragraph of a Wikipedia article."""
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "titles": title,
                "prop": "extracts",
                "exintro": True,
                "explaintext": True,
                "exsectionformat": "plain",
            }
            resp = _session.get(url, params=params, timeout=self.timeout)
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                extract = page.get("extract", "")
                if extract:
                    # Return first 400 chars
                    return extract[:400]
        except Exception as e:
            logger.warning(f"Wikipedia extract error: {e}")
        return None

    # ==================================================================
    # 2. Reddit (JSON API — no key needed)
    # ==================================================================
    def _search_reddit(self, query: str) -> List[Dict[str, Any]]:
        """Search Reddit for related discussions."""
        results = []
        try:
            url = "https://www.reddit.com/search.json"
            params = {
                "q": query,
                "sort": "relevance",
                "limit": 5,
                "t": "month",
            }
            headers = {
                "User-Agent": "VeriPulse/2.0 (AcademicProject)",
            }
            resp = requests.get(
                url, params=params, headers=headers, timeout=self.timeout
            )
            if resp.status_code != 200:
                logger.warning(f"Reddit search returned {resp.status_code}")
                return results

            data = resp.json()
            children = data.get("data", {}).get("children", [])

            for child in children[:5]:
                post = child.get("data", {})
                subreddit = post.get("subreddit", "")
                title = post.get("title", "")
                score = post.get("score", 0)
                permalink = post.get("permalink", "")
                selftext = post.get("selftext", "")

                # Skip very low-quality posts
                if score < 2:
                    continue

                results.append({
                    "source": "Reddit",
                    "title": title[:150],
                    "url": f"https://www.reddit.com{permalink}" if permalink else "",
                    "snippet": selftext[:200] if selftext else title[:200],
                    "subreddit": f"r/{subreddit}",
                    "score": score,
                })

        except Exception as e:
            logger.warning(f"Reddit search error: {e}")

        return results

    # ==================================================================
    # 3. Google News (RSS feed — free, no key)
    # ==================================================================
    def _search_google_news(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Google News RSS feed for matching stories."""
        results = []
        try:
            import feedparser
        except ImportError:
            logger.warning("feedparser not installed — skipping Google News")
            return results

        try:
            encoded = quote_plus(query)
            rss_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
            feed = feedparser.parse(rss_url)

            for entry in feed.entries[:5]:
                title = entry.get("title", "")
                link = entry.get("link", "")
                published = entry.get("published", "")

                # Google News titles are often "Title - Source"
                source_name = "Google News"
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    source_name = parts[1] if len(parts) > 1 else "Google News"

                results.append({
                    "source": source_name,
                    "title": title[:150],
                    "url": link,
                    "published": published,
                })

        except Exception as e:
            logger.warning(f"Google News RSS error: {e}")

        return results

    # ==================================================================
    # 4. DuckDuckGo (Instant Answer API — free)
    # ==================================================================
    def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """Search DuckDuckGo for web results."""
        results = []
        try:
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 1,
            }
            resp = _session.get(url, params=params, timeout=self.timeout)
            data = resp.json()

            # Related topics
            for topic in data.get("RelatedTopics", [])[:5]:
                if isinstance(topic, dict) and "Text" in topic and "FirstURL" in topic:
                    results.append({
                        "source": "DuckDuckGo",
                        "title": topic.get("Text", "")[:150],
                        "url": topic.get("FirstURL", ""),
                        "snippet": topic.get("Text", "")[:200],
                    })

            # Abstract
            if data.get("Abstract"):
                results.append({
                    "source": "DuckDuckGo",
                    "title": data.get("Heading", ""),
                    "url": data.get("AbstractURL", ""),
                    "snippet": data["Abstract"][:200],
                })

        except Exception as e:
            logger.warning(f"DuckDuckGo search error: {e}")

        return results

    # ==================================================================
    # 5. Fact-Checkers (via DuckDuckGo site: search)
    # ==================================================================
    def _search_fact_checkers(self, query: str) -> List[Dict[str, Any]]:
        """Search fact-checking sites via DuckDuckGo."""
        fact_checks = []
        sites = ["snopes.com", "factcheck.org", "politifact.com"]

        for site in sites[:2]:
            try:
                site_query = f"site:{site} {query}"
                url = "https://api.duckduckgo.com/"
                params = {"q": site_query, "format": "json"}
                resp = _session.get(url, params=params, timeout=self.timeout)
                data = resp.json()

                for topic in data.get("RelatedTopics", [])[:2]:
                    if isinstance(topic, dict) and "Text" in topic:
                        fact_checks.append({
                            "source": site,
                            "snippet": topic.get("Text", "")[:200],
                            "url": topic.get("FirstURL", ""),
                        })

                time.sleep(0.3)  # Respect rate limits
            except Exception as e:
                logger.warning(f"Fact-checker search error ({site}): {e}")

        return fact_checks

    # ==================================================================
    # Corroboration Assessment
    # ==================================================================
    def _assess_corroboration(
        self,
        wiki: Optional[Dict],
        reddit: List,
        gnews: List,
        ddg: List,
        fact_checks: List,
        headline: str,
    ) -> Dict[str, Any]:
        """
        Assess how well external sources corroborate (or contradict) the claim.

        Returns dict with 'level' (str) and 'score' (int 0-100).
        """
        score = 0
        headline_lower = headline.lower()

        # Wikipedia found
        if wiki:
            score += 15

        # Google News coverage (strongest signal)
        if len(gnews) >= 3:
            score += 25
        elif len(gnews) >= 1:
            # Weight by source authority
            authority_bonus = sum(
                _domain_authority(r.get("url", "")) for r in gnews[:3]
            )
            score += min(20, int(authority_bonus * 8))
        else:
            score -= 5  # No news coverage is a warning sign

        # Reddit discussions
        if reddit:
            high_score_posts = [r for r in reddit if r.get("score", 0) > 50]
            if high_score_posts:
                score += 10
            else:
                score += 5

        # DuckDuckGo results
        if len(ddg) >= 2:
            score += 10
        elif len(ddg) >= 1:
            score += 5

        # Fact-checker results (can strongly push either direction)
        if fact_checks:
            debunked_keywords = [
                "false", "fake", "misleading", "incorrect", "debunk",
                "myth", "hoax", "untrue", "wrong", "pants on fire",
                "mostly false", "no evidence",
            ]
            confirmed_keywords = [
                "true", "correct", "confirmed", "verified", "accurate",
                "mostly true",
            ]
            for fc in fact_checks:
                snippet_lower = fc.get("snippet", "").lower()
                if any(kw in snippet_lower for kw in debunked_keywords):
                    return {"level": "contradicted", "score": max(0, score - 30)}
                if any(kw in snippet_lower for kw in confirmed_keywords):
                    score += 15

        # Clamp
        score = max(0, min(100, score))

        # Determine level
        if score >= 50:
            level = "strong"
        elif score >= 30:
            level = "moderate"
        elif score >= 10:
            level = "weak"
        else:
            level = "none"

        return {"level": level, "score": score}

    # ==================================================================
    # Helpers
    # ==================================================================
    def _extract_search_terms(self, headline: str) -> str:
        """Extract meaningful search terms from headline."""
        noise_words = {
            "breaking", "shocking", "amazing", "you", "wont", "believe",
            "this", "that", "the", "doctors", "hate", "trick", "secret",
            "share", "before", "deleted", "banned", "they", "dont", "want",
            "just", "said", "says", "new", "first", "last", "will",
        }
        cleaned = re.sub(r"[!?:]+", "", headline.lower())
        words = cleaned.split()
        meaningful = [w for w in words if w not in noise_words and len(w) > 2]
        return " ".join(meaningful[:6])

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "searches_performed": 0,
            "sources_found": [],
            "corroboration_level": "none",
            "consensus_score": 0,
            "fact_check_results": [],
            "news_coverage": [],
            "wikipedia_result": None,
            "reddit_results": [],
            "google_news_results": [],
        }
