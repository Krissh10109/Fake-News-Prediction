"""
Enhanced Hybrid News Verification Engine with Web Search
Combines ML + Rules + Real Web Verification
"""

import re
import requests
from typing import Dict, List, Any, Optional
from urllib.parse import quote_plus
import time
import logging

try:
    from Backend.multi_source_verifier import MultiSourceVerifier
except ImportError:
    try:
        from multi_source_verifier import MultiSourceVerifier
    except ImportError:
        MultiSourceVerifier = None

logger = logging.getLogger(__name__)


class EnhancedHybridVerifier:
    """
    Advanced verification with real web search:
    1. ML model prediction
    2. Rule-based analysis
    3. Web search verification (Wikipedia, DuckDuckGo, Fact-checkers)
    """
    
    def __init__(self, ml_prediction: str, ml_confidence: float):
        self.ml_prediction = ml_prediction
        self.ml_confidence = ml_confidence
        self.search_results = []
        # Required headers for API access
        self.headers = {
            'User-Agent': 'NewsVerifier/1.0 (Academic Project; contact@example.com)',
            'Accept': 'application/json'
        }
        
    def verify_article(self, article_text: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive verification with web search
        """
        # Extract headline and body
        lines = article_text.strip().split('\n')
        headline = lines[0] if lines else ""
        body = '\n'.join(lines[1:]) if len(lines) > 1 else article_text
        
        # Perform analyses
        claims = self._extract_claims(article_text)
        
        # WEB SEARCH VERIFICATION
        web_verification = self._verify_with_web_search(headline, claims)
        
        red_flags = self._detect_red_flags(headline, body, url)
        linguistic = self._analyze_linguistics(headline, body)
        
        # Calculate credibility with web verification
        credibility_score = self._calculate_credibility(
            red_flags, linguistic, web_verification
        )
        
        recommendation = self._get_recommendation(credibility_score, web_verification)
        confidence_level = self._get_confidence_level(credibility_score, red_flags)
        
        return {
            "overall_assessment": {
                "credibility_score": credibility_score,
                "recommendation": recommendation,
                "confidence_level": confidence_level,
                "ml_prediction": self.ml_prediction,
                "ml_confidence": round(self.ml_confidence * 100, 2)
            },
            "claims_analysis": claims,
            "web_verification": web_verification,
            "red_flags": red_flags,
            "linguistic_analysis": linguistic,
            "evidence_summary": self._generate_summary(
                credibility_score, recommendation, red_flags, 
                linguistic, web_verification
            ),
            "model_used": "enhanced_hybrid_ml_rules_web",
            "error": False
        }
    
    def _verify_with_web_search(self, headline: str, claims: List[Dict]) -> Dict[str, Any]:
        """
        Search the web to verify claims using the multi-source engine.
        Falls back to legacy individual searches if MultiSourceVerifier is unavailable.
        """
        # Use the multi-source engine if available
        if MultiSourceVerifier is not None:
            try:
                msv = MultiSourceVerifier()
                result = msv.verify_claim(headline)
                return result
            except Exception as e:
                logger.warning(f"Multi-source verifier failed, falling back: {e}")

        # --- Legacy fallback (original individual searches) ---
        verification_result = {
            "searches_performed": 0,
            "sources_found": [],
            "corroboration_level": "none",
            "fact_check_results": [],
            "news_coverage": [],
            "wikipedia_result": None,
            "reddit_results": [],
            "google_news_results": [],
        }
        
        search_query = self._extract_search_terms(headline)
        if not search_query:
            return verification_result
        
        logger.info(f"Legacy web search: {search_query}")
        
        wiki_result = self._search_wikipedia(search_query)
        if wiki_result:
            verification_result["sources_found"].append(wiki_result)
            verification_result["wikipedia_result"] = wiki_result
            verification_result["searches_performed"] += 1
        
        ddg_results = self._search_duckduckgo(search_query)
        verification_result["news_coverage"] = ddg_results
        verification_result["searches_performed"] += len(ddg_results)
        
        fact_check = self._search_fact_checkers(search_query)
        if fact_check:
            verification_result["fact_check_results"] = fact_check
            verification_result["searches_performed"] += len(fact_check)
        
        verification_result["corroboration_level"] = self._assess_corroboration(
            wiki_result, ddg_results, fact_check
        )
        
        return verification_result
    
    def _extract_search_terms(self, headline: str) -> str:
        """Extract meaningful search terms from headline"""
        # Remove common clickbait words
        noise_words = ['breaking', 'shocking', 'amazing', 'you', 'wont', 'believe',
                      'this', 'that', 'the', 'doctors', 'hate', 'trick', 'secret',
                      'share', 'before', 'deleted', 'banned', 'they', 'dont', 'want']
        
        # Clean headline
        cleaned = re.sub(r'[!?:]+', '', headline.lower())
        words = cleaned.split()
        
        # Filter out noise
        meaningful_words = [w for w in words if w not in noise_words and len(w) > 3]
        
        # Take first 5 meaningful words
        search_terms = ' '.join(meaningful_words[:5])
        return search_terms
    
    def _search_wikipedia(self, query: str) -> Optional[Dict[str, Any]]:
        """Search Wikipedia for verification"""
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": 3
            }
            
            response = requests.get(url, params=params, headers=self.headers, timeout=5)
            data = response.json()
            
            if "query" in data and "search" in data["query"]:
                results = data["query"]["search"]
                if results:
                    # Clean HTML from snippet
                    snippet = re.sub(r'<[^>]+>', '', results[0].get('snippet', ''))
                    return {
                        "source": "Wikipedia",
                        "url": f"https://en.wikipedia.org/wiki/{results[0]['title'].replace(' ', '_')}",
                        "title": results[0]['title'],
                        "snippet": snippet[:200],
                        "found": True
                    }
        except requests.exceptions.RequestException as e:
            logger.warning(f"Wikipedia search error: {e}")
        except Exception as e:
            logger.warning(f"Wikipedia parse error: {e}")
        
        return None
    
    def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """Search using DuckDuckGo Instant Answer API (free, no key needed)"""
        results = []
        
        try:
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 1
            }
            
            response = requests.get(url, params=params, headers=self.headers, timeout=5)
            data = response.json()
            
            # Extract related topics/results
            if "RelatedTopics" in data:
                for topic in data["RelatedTopics"][:5]:
                    if isinstance(topic, dict) and "Text" in topic and "FirstURL" in topic:
                        results.append({
                            "source": "DuckDuckGo",
                            "title": topic.get("Text", "")[:100],
                            "url": topic.get("FirstURL", ""),
                            "snippet": topic.get("Text", "")[:200]
                        })
            
            # Also check abstract
            if "Abstract" in data and data["Abstract"]:
                results.append({
                    "source": "DuckDuckGo",
                    "title": data.get("Heading", ""),
                    "url": data.get("AbstractURL", ""),
                    "snippet": data["Abstract"][:200]
                })
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"DuckDuckGo search error: {e}")
        except Exception as e:
            logger.warning(f"DuckDuckGo parse error: {e}")
        
        return results
    
    def _search_fact_checkers(self, query: str) -> List[Dict[str, Any]]:
        """Search fact-checking sites via DuckDuckGo"""
        fact_checks = []
        
        # List of fact-checker domains
        fact_check_sites = ["snopes.com", "factcheck.org", "politifact.com"]
        
        try:
            # Search DuckDuckGo with site-specific queries
            for site in fact_check_sites[:2]:  # Limit to avoid rate limits
                site_query = f"site:{site} {query}"
                url = "https://api.duckduckgo.com/"
                params = {
                    "q": site_query,
                    "format": "json"
                }
                
                response = requests.get(url, params=params, headers=self.headers, timeout=5)
                data = response.json()
                
                if "RelatedTopics" in data and data["RelatedTopics"]:
                    for topic in data["RelatedTopics"][:2]:
                        if isinstance(topic, dict) and "Text" in topic:
                            fact_checks.append({
                                "source": site,
                                "snippet": topic.get("Text", "")[:200],
                                "url": topic.get("FirstURL", "")
                            })
                
                time.sleep(0.3)  # Respect rate limits
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Fact-checker search error: {e}")
        except Exception as e:
            logger.warning(f"Fact-checker parse error: {e}")
        
        return fact_checks
    
    def _assess_corroboration(self, wiki_result: Optional[Dict], 
                             ddg_results: List, 
                             fact_checks: List) -> str:
        """Assess level of corroboration from web sources"""
        score = 0
        
        # Wikipedia found
        if wiki_result:
            score += 3
        
        # Multiple news sources
        if len(ddg_results) >= 3:
            score += 3
        elif len(ddg_results) >= 1:
            score += 1
        
        # Fact-checkers found it
        if len(fact_checks) > 0:
            # Check if they debunked it
            debunked_keywords = ['false', 'fake', 'misleading', 'incorrect', 
                                'debunk', 'myth', 'hoax', 'untrue', 'wrong']
            for fc in fact_checks:
                snippet_lower = fc.get('snippet', '').lower()
                if any(kw in snippet_lower for kw in debunked_keywords):
                    return "contradicted"  # Fact-checkers say it's false
            score += 2
        
        # Determine level
        if score >= 6:
            return "strong"
        elif score >= 3:
            return "moderate"
        elif score >= 1:
            return "weak"
        else:
            return "none"
    
    def _extract_claims(self, text: str) -> List[Dict[str, Any]]:
        """Extract verifiable claims from text"""
        claims = []
        
        # Statistical claims
        stats_pattern = r'\b(\d+(?:\.\d+)?)\s*(%|percent|million|billion|thousand)\b'
        stats_matches = re.finditer(stats_pattern, text, re.IGNORECASE)
        
        for match in stats_matches:
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            claim_text = text[start:end]
            claims.append({
                "claim": claim_text.strip(),
                "claim_type": "statistical",
                "verification_status": "requires_verification",
                "confidence_score": 50,
                "reasoning": "Statistical claim identified"
            })
        
        # Quoted statements
        quote_pattern = r'"([^"]{10,150})"'
        quote_matches = re.finditer(quote_pattern, text)
        
        for match in quote_matches:
            claims.append({
                "claim": match.group(1),
                "claim_type": "quote",
                "verification_status": "requires_verification",
                "confidence_score": 60,
                "reasoning": "Attributed quote found"
            })
        
        return claims[:5]
    
    def _detect_red_flags(self, headline: str, body: str, url: Optional[str]) -> List[Dict[str, Any]]:
        """Detect credibility red flags"""
        red_flags = []
        
        # Clickbait patterns
        clickbait_patterns = [
            (r'BREAKING:', 'critical', 'Excessive "BREAKING" indicator'),
            (r'SHOCKING|SHOCKED', 'high', 'Sensational emotional language'),
            (r'WON\'T BELIEVE', 'high', 'Clickbait phrase'),
            (r'THIS\s+(?:SIMPLE|ONE)\s+TRICK', 'critical', 'Classic clickbait'),
            (r'!!!+', 'high', 'Excessive exclamation marks'),
            (r'[A-Z]{10,}', 'moderate', 'Excessive capitalization')
        ]
        
        for pattern, severity, description in clickbait_patterns:
            if re.search(pattern, headline, re.IGNORECASE):
                red_flags.append({
                    "type": "content",
                    "severity": severity,
                    "description": description,
                    "evidence": f"Pattern found in headline"
                })
        
        # Conspiracy indicators
        conspiracy_patterns = [
            (r'mainstream\s+media\s+(?:won\'t|refuse|hiding)', 'critical', 'Conspiracy language'),
            (r'(?:they|government)\s+(?:don\'t want|hiding)', 'critical', 'Conspiracy narrative'),
            (r'share\s+(?:before|this)', 'high', 'Viral manipulation'),
            (r'big\s+pharma', 'moderate', 'Anti-establishment rhetoric')
        ]
        
        full_text = headline + ' ' + body
        for pattern, severity, description in conspiracy_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                red_flags.append({
                    "type": "content",
                    "severity": severity,
                    "description": description,
                    "evidence": "Conspiracy indicator detected"
                })
        
        # Medical misinformation
        if re.search(r'cure(?:s|d)?\s+(?:all|any|cancer|covid)', full_text, re.IGNORECASE):
            red_flags.append({
                "type": "content",
                "severity": "critical",
                "description": "Unrealistic medical claims",
                "evidence": "Claims of miracle cures"
            })
        
        # Dangerous substances
        if re.search(r'bleach|hydrogen peroxide|urine therapy', full_text, re.IGNORECASE):
            red_flags.append({
                "type": "content",
                "severity": "critical",
                "description": "Potentially dangerous health advice",
                "evidence": "References to unsafe substances"
            })
        
        # No sources cited
        has_quotes = bool(re.search(r'"[^"]+"', body))
        has_attribution = bool(re.search(r'said|according to|stated|reported', body, re.IGNORECASE))
        
        if not has_quotes and not has_attribution and len(body) > 200:
            red_flags.append({
                "type": "source",
                "severity": "high",
                "description": "No quotes or attributions found",
                "evidence": "Article lacks cited sources"
            })
        
        return red_flags
    
    def _analyze_linguistics(self, headline: str, body: str) -> Dict[str, int]:
        """Analyze linguistic patterns"""
        full_text = headline + ' ' + body
        
        # Emotional manipulation
        emotion_words = ['shocking', 'outrage', 'scandal', 'devastating', 
                        'horrifying', 'terrifying', 'amazing', 'incredible']
        emotion_count = sum(1 for word in emotion_words if word in full_text.lower())
        emotional_manipulation = min(10, emotion_count * 2)
        
        # Clickbait indicators
        clickbait_score = 0
        if re.search(r'!!!+', headline):
            clickbait_score += 3
        if re.search(r'[A-Z]{10,}', headline):
            clickbait_score += 3
        if re.search(r'WON\'T BELIEVE', headline, re.IGNORECASE):
            clickbait_score += 4
        clickbait_indicators = min(10, clickbait_score)
        
        # Source citations
        has_quotes = len(re.findall(r'"[^"]+"', body))
        has_names = len(re.findall(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', body))
        citation_score = min(10, has_quotes + has_names)
        
        # Professionalism
        grammar_errors = len(re.findall(r'\s+[a-z]', body))
        professionalism = max(0, 10 - min(5, grammar_errors))
        
        # Consistency
        headline_words = set(headline.lower().split())
        body_words = set(body.lower().split())
        overlap = len(headline_words & body_words)
        consistency = min(10, overlap)
        
        return {
            "emotional_manipulation_score": emotional_manipulation,
            "clickbait_indicators": clickbait_indicators,
            "source_citation_quality": citation_score,
            "writing_professionalism": professionalism,
            "headline_body_consistency": consistency
        }
    
    def _calculate_credibility(self, red_flags: List, linguistic: Dict, 
                              web_verification: Dict) -> int:
        """Calculate credibility with web verification"""
        
        # Base ML score
        if self.ml_prediction.lower() == "fake":
            base_score = (1 - self.ml_confidence) * 100
        else:
            base_score = self.ml_confidence * 100
        
        # Red flag penalty
        critical_flags = sum(1 for f in red_flags if f['severity'] == 'critical')
        high_flags = sum(1 for f in red_flags if f['severity'] == 'high')
        moderate_flags = sum(1 for f in red_flags if f['severity'] == 'moderate')
        flag_penalty = (critical_flags * 25) + (high_flags * 15) + (moderate_flags * 5)
        
        # Linguistic score
        linguistic_score = (
            (10 - linguistic['emotional_manipulation_score']) * 2 +
            (10 - linguistic['clickbait_indicators']) * 2 +
            linguistic['source_citation_quality'] * 2 +
            linguistic['writing_professionalism'] * 2 +
            linguistic['headline_body_consistency']
        ) / 9 * 10
        
        # WEB VERIFICATION ADJUSTMENT
        web_adjustment = 0
        corroboration = web_verification.get('corroboration_level', 'none')
        
        if corroboration == 'contradicted':
            web_adjustment = -30  # Fact-checkers debunked it
        elif corroboration == 'strong':
            web_adjustment = +20  # Multiple sources confirm
        elif corroboration == 'moderate':
            web_adjustment = +10  # Some sources confirm
        elif corroboration == 'weak':
            web_adjustment = +5   # Minimal confirmation
        else:  # none
            web_adjustment = -10  # No sources found (suspicious)
        
        # Weighted combination with web verification
        final_score = (
            base_score * 0.4 +           # 40% ML model
            (100 - flag_penalty) * 0.25 + # 25% red flags
            linguistic_score * 0.15 +     # 15% linguistic
            (50 + web_adjustment) * 0.20  # 20% web verification
        )
        
        return max(0, min(100, int(final_score)))
    
    def _get_recommendation(self, score: int, web_verification: Dict) -> str:
        """Determine recommendation"""
        corroboration = web_verification.get('corroboration_level', 'none')
        
        # Override based on fact-checker results
        if corroboration == 'contradicted':
            return "likely_fake"
        
        if score >= 70:
            return "likely_real"
        elif score >= 50:
            return "mixed"
        elif score >= 30:
            return "questionable"
        else:
            return "likely_fake"
    
    def _get_confidence_level(self, score: int, red_flags: List) -> str:
        """Determine confidence level"""
        critical_flags = sum(1 for f in red_flags if f['severity'] == 'critical')
        
        if critical_flags >= 2 or score < 20 or score > 90:
            return "high"
        elif score < 40 or score > 70:
            return "moderate"
        else:
            return "low"
    
    def _generate_summary(self, score: int, recommendation: str, 
                         red_flags: List, linguistic: Dict,
                         web_verification: Dict) -> str:
        """Generate summary with web verification results"""
        
        summary_parts = []
        
        # Overall
        if recommendation == "likely_fake":
            summary_parts.append(
                f"This article shows strong indicators of misinformation (credibility: {score}/100). "
            )
        elif recommendation == "likely_real":
            summary_parts.append(
                f"This article appears credible (credibility: {score}/100). "
            )
        else:
            summary_parts.append(
                f"This article shows mixed signals (credibility: {score}/100). "
            )
        
        # ML input
        summary_parts.append(
            f"ML model: '{self.ml_prediction}' ({self.ml_confidence*100:.1f}% confidence). "
        )
        
        # WEB VERIFICATION RESULTS
        corroboration = web_verification.get('corroboration_level', 'none')
        searches = web_verification.get('searches_performed', 0)
        
        if searches > 0:
            summary_parts.append(f"Performed {searches} web searches. ")
            
            if corroboration == 'contradicted':
                summary_parts.append(
                    "⚠️ CRITICAL: Fact-checking websites have debunked this claim. "
                )
            elif corroboration == 'strong':
                summary_parts.append(
                    "✅ Multiple credible sources corroborate the main claims. "
                )
            elif corroboration == 'moderate':
                summary_parts.append(
                    "Some sources found, but coverage is limited. "
                )
            elif corroboration == 'weak':
                summary_parts.append(
                    "Minimal external verification found. "
                )
            else:
                summary_parts.append(
                    "⚠️ No credible sources found covering this story. "
                )
        
        # Wikipedia result
        wiki = web_verification.get('wikipedia_result')
        if wiki:
            summary_parts.append(f"Wikipedia: Found '{wiki['title']}'. ")
        
        # Red flags
        if red_flags:
            critical_count = sum(1 for f in red_flags if f['severity'] == 'critical')
            if critical_count > 0:
                summary_parts.append(
                    f"Found {critical_count} critical red flag(s). "
                )
        
        # Recommendation
        if recommendation == "likely_fake":
            summary_parts.append(
                "Recommendation: Treat with extreme skepticism. Do not share."
            )
        elif recommendation == "likely_real":
            summary_parts.append(
                "Recommendation: Appears legitimate, but verify important details independently."
            )
        else:
            summary_parts.append(
                "Recommendation: Exercise caution and verify through authoritative sources."
            )
        
        return ''.join(summary_parts)


def verify_with_enhanced_hybrid(article_text: str, ml_prediction: str, 
                               ml_confidence: float, url: Optional[str] = None) -> Dict[str, Any]:
    """
    Enhanced verification with web search
    
    Args:
        article_text: The article to verify
        ml_prediction: Your ML model's prediction ("Real" or "Fake")
        ml_confidence: ML model confidence (0-1)
        url: Optional article URL
    
    Returns:
        Comprehensive verification report with web search results
    """
    verifier = EnhancedHybridVerifier(ml_prediction, ml_confidence)
    return verifier.verify_article(article_text, url)
