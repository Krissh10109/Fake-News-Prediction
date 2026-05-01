"""
Hybrid News Verification Engine
Combines ML predictions with rule-based credibility analysis
No external APIs required - completely free
"""

import re
from typing import Dict, List, Any, Optional


class HybridVerifier:
    """
    Advanced fake news detection combining multiple techniques:
    1. ML model prediction (existing)
    2. Linguistic pattern analysis
    3. Credibility indicators
    4. Red flag detection
    """
    
    def __init__(self, ml_prediction: str, ml_confidence: float):
        """
        Initialize with ML model results
        
        Args:
            ml_prediction: "Real" or "Fake" from your ML model
            ml_confidence: Confidence score (0-1)
        """
        self.ml_prediction = ml_prediction
        self.ml_confidence = ml_confidence
        
    def verify_article(self, article_text: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive verification
        
        Returns:
            Structured verification report
        """
        # Extract headline and body
        lines = article_text.strip().split('\n')
        headline = lines[0] if lines else ""
        body = '\n'.join(lines[1:]) if len(lines) > 1 else article_text
        
        # Perform analyses
        claims = self._extract_claims(article_text)
        red_flags = self._detect_red_flags(headline, body, url)
        linguistic = self._analyze_linguistics(headline, body)
        credibility_score = self._calculate_credibility(red_flags, linguistic)
        
        # Determine final recommendation
        recommendation = self._get_recommendation(credibility_score)
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
            "red_flags": red_flags,
            "linguistic_analysis": linguistic,
            "evidence_summary": self._generate_summary(
                credibility_score, recommendation, red_flags, linguistic
            ),
            "model_used": "hybrid_ml_rules",
            "error": False
        }
    
    def _extract_claims(self, text: str) -> List[Dict[str, Any]]:
        """Extract verifiable claims from text"""
        claims = []
        
        # Look for statistical claims
        stats_pattern = r'\b(\d+(?:\.\d+)?)\s*(%|percent|million|billion|thousand)\b'
        stats_matches = re.finditer(stats_pattern, text, re.IGNORECASE)
        
        for match in stats_matches:
            claim_text = text[max(0, match.start()-50):min(len(text), match.end()+50)]
            claims.append({
                "claim": claim_text.strip(),
                "claim_type": "statistical",
                "verification_status": "requires_verification",
                "confidence_score": 50,
                "reasoning": "Statistical claim identified - requires external verification"
            })
        
        # Look for quoted statements
        quote_pattern = r'"([^"]{10,150})"'
        quote_matches = re.finditer(quote_pattern, text)
        
        for match in quote_matches:
            claims.append({
                "claim": match.group(1),
                "claim_type": "quote",
                "verification_status": "requires_verification",
                "confidence_score": 60,
                "reasoning": "Attributed quote - source verification needed"
            })
        
        # Look for factual date/event claims
        date_pattern = r'\b(today|yesterday|on\s+\w+|in\s+\d{4})\b'
        if re.search(date_pattern, text, re.IGNORECASE):
            sentences = text.split('.')
            for sent in sentences[:3]:  # Check first 3 sentences
                if re.search(date_pattern, sent, re.IGNORECASE):
                    claims.append({
                        "claim": sent.strip(),
                        "claim_type": "event",
                        "verification_status": "requires_verification",
                        "confidence_score": 55,
                        "reasoning": "Temporal event claim identified"
                    })
        
        return claims[:5]  # Return top 5 claims
    
    def _detect_red_flags(self, headline: str, body: str, url: Optional[str]) -> List[Dict[str, Any]]:
        """Detect credibility red flags"""
        red_flags = []
        
        # Clickbait headline patterns
        clickbait_patterns = [
            (r'BREAKING:', 'critical', 'Excessive use of "BREAKING" indicator'),
            (r'SHOCKING|SHOCKED', 'high', 'Sensational emotional language'),
            (r'WON\'T BELIEVE', 'high', 'Clickbait phrase detected'),
            (r'THIS\s+(?:SIMPLE|ONE)\s+TRICK', 'critical', 'Classic clickbait pattern'),
            (r'DOCTORS\s+(?:HATE|SHOCKED)', 'critical', 'Medical clickbait pattern'),
            (r'!!!+', 'high', 'Excessive exclamation marks'),
            (r'[A-Z]{10,}', 'moderate', 'Excessive capitalization')
        ]
        
        for pattern, severity, description in clickbait_patterns:
            if re.search(pattern, headline, re.IGNORECASE):
                red_flags.append({
                    "type": "content",
                    "severity": severity,
                    "description": description,
                    "evidence": f"Found in headline: {pattern}"
                })
        
        # Conspiracy theory indicators
        conspiracy_patterns = [
            (r'mainstream\s+media\s+(?:won\'t|refuse|hiding)', 'critical', 'Conspiracy theory language'),
            (r'(?:they|government)\s+(?:don\'t want|hiding|covering)', 'critical', 'Conspiracy narrative'),
            (r'share\s+(?:before|this)', 'high', 'Viral manipulation tactic'),
            (r'deleted|censored|banned', 'high', 'Suppression claim'),
            (r'big\s+pharma|big\s+tech', 'moderate', 'Anti-establishment rhetoric')
        ]
        
        full_text = headline + ' ' + body
        for pattern, severity, description in conspiracy_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                red_flags.append({
                    "type": "content",
                    "severity": severity,
                    "description": description,
                    "evidence": f"Conspiracy indicator: {pattern}"
                })
        
        # Anonymous sources
        if re.search(r'anonymous\s+source|unnamed\s+(?:source|official)', body, re.IGNORECASE):
            red_flags.append({
                "type": "source",
                "severity": "moderate",
                "description": "Relies on anonymous sources",
                "evidence": "No named sources for claims"
            })
        
        # Lack of attribution
        has_quotes = bool(re.search(r'"[^"]+"', body))
        has_attribution = bool(re.search(r'said|according to|stated|reported', body, re.IGNORECASE))
        
        if not has_quotes and not has_attribution and len(body) > 200:
            red_flags.append({
                "type": "source",
                "severity": "high",
                "description": "No quotes or attributions found",
                "evidence": "Article lacks cited sources"
            })
        
        # Medical/health misinformation patterns
        if re.search(r'cure(?:s|d)?\s+(?:all|any|cancer|diabetes)', full_text, re.IGNORECASE):
            red_flags.append({
                "type": "content",
                "severity": "critical",
                "description": "Unrealistic medical claims",
                "evidence": "Claims of miracle cures"
            })
        
        # Urgency manipulation
        if re.search(r'(?:act\s+now|limited\s+time|urgent|immediately)', full_text, re.IGNORECASE):
            red_flags.append({
                "type": "content",
                "severity": "moderate",
                "description": "Artificial urgency",
                "evidence": "Pressure tactics detected"
            })
        
        return red_flags
    
    def _analyze_linguistics(self, headline: str, body: str) -> Dict[str, int]:
        """Analyze linguistic patterns"""
        full_text = headline + ' ' + body
        
        # Emotional manipulation score (0-10)
        emotion_words = ['shocking', 'outrage', 'scandal', 'devastating', 
                        'horrifying', 'terrifying', 'amazing', 'incredible']
        emotion_count = sum(1 for word in emotion_words if word in full_text.lower())
        emotional_manipulation = min(10, emotion_count * 2)
        
        # Clickbait indicators (0-10)
        clickbait_score = 0
        if re.search(r'!!!+', headline):
            clickbait_score += 3
        if re.search(r'[A-Z]{10,}', headline):
            clickbait_score += 3
        if re.search(r'WON\'T BELIEVE|YOU NEED TO', headline, re.IGNORECASE):
            clickbait_score += 4
        clickbait_indicators = min(10, clickbait_score)
        
        # Source citation quality (0-10, higher is better)
        has_quotes = len(re.findall(r'"[^"]+"', body))
        has_names = len(re.findall(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', body))
        has_attribution = len(re.findall(r'according to|said|stated', body, re.IGNORECASE))
        citation_score = min(10, has_quotes + has_names + has_attribution)
        
        # Writing professionalism (0-10, higher is better)
        sentences = body.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        # Grammar check (simple)
        grammar_errors = 0
        grammar_errors += len(re.findall(r'\s+[a-z]', body))  # Lowercase after period
        grammar_errors += len(re.findall(r'\s\s+', body))  # Multiple spaces
        
        professionalism = 10 - min(5, grammar_errors)
        if avg_sentence_length < 5 or avg_sentence_length > 40:
            professionalism -= 2
        professionalism = max(0, professionalism)
        
        # Headline-body consistency (0-10, higher is better)
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
    
    def _calculate_credibility(self, red_flags: List[Dict], linguistic: Dict) -> int:
        """Calculate overall credibility score (0-100)"""
        
        # Start with ML model confidence
        if self.ml_prediction.lower() == "fake":
            base_score = (1 - self.ml_confidence) * 100
        else:
            base_score = self.ml_confidence * 100
        
        # Penalty for red flags
        critical_flags = sum(1 for flag in red_flags if flag['severity'] == 'critical')
        high_flags = sum(1 for flag in red_flags if flag['severity'] == 'high')
        moderate_flags = sum(1 for flag in red_flags if flag['severity'] == 'moderate')
        
        flag_penalty = (critical_flags * 25) + (high_flags * 15) + (moderate_flags * 5)
        
        # Adjust based on linguistic analysis
        linguistic_score = (
            (10 - linguistic['emotional_manipulation_score']) * 2 +
            (10 - linguistic['clickbait_indicators']) * 2 +
            linguistic['source_citation_quality'] * 2 +
            linguistic['writing_professionalism'] * 2 +
            linguistic['headline_body_consistency']
        ) / 9 * 10  # Normalize to 0-10, then scale to 0-100
        
        # Weighted combination
        final_score = (
            base_score * 0.5 +  # 50% ML model
            (100 - flag_penalty) * 0.3 +  # 30% red flags
            linguistic_score * 0.2  # 20% linguistic
        )
        
        return max(0, min(100, int(final_score)))
    
    def _get_recommendation(self, score: int) -> str:
        """Determine recommendation based on score"""
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
        critical_flags = sum(1 for flag in red_flags if flag['severity'] == 'critical')
        
        if critical_flags >= 2 or score < 20 or score > 90:
            return "high"
        elif score < 40 or score > 70:
            return "moderate"
        else:
            return "low"
    
    def _generate_summary(self, score: int, recommendation: str, 
                         red_flags: List, linguistic: Dict) -> str:
        """Generate human-readable summary"""
        
        summary_parts = []
        
        # Overall assessment
        if recommendation == "likely_fake":
            summary_parts.append(
                f"This article shows strong indicators of misinformation (credibility: {score}/100). "
            )
        elif recommendation == "likely_real":
            summary_parts.append(
                f"This article appears credible with few warning signs (credibility: {score}/100). "
            )
        else:
            summary_parts.append(
                f"This article shows mixed signals (credibility: {score}/100). "
            )
        
        # ML model input
        summary_parts.append(
            f"The machine learning model classified it as '{self.ml_prediction}' "
            f"with {self.ml_confidence*100:.1f}% confidence. "
        )
        
        # Red flags
        if red_flags:
            critical_count = sum(1 for f in red_flags if f['severity'] == 'critical')
            high_count = sum(1 for f in red_flags if f['severity'] == 'high')
            
            if critical_count > 0:
                summary_parts.append(
                    f"Found {critical_count} critical red flag(s) including: "
                    f"{red_flags[0]['description'].lower()}. "
                )
            elif high_count > 0:
                summary_parts.append(
                    f"Detected {high_count} high-severity warning(s). "
                )
            else:
                summary_parts.append(f"Identified {len(red_flags)} minor concern(s). ")
        
        # Linguistic analysis
        if linguistic['emotional_manipulation_score'] > 6:
            summary_parts.append(
                "The article uses highly emotional and manipulative language. "
            )
        
        if linguistic['clickbait_indicators'] > 6:
            summary_parts.append(
                "Strong clickbait patterns detected in headline and content. "
            )
        
        if linguistic['source_citation_quality'] < 4:
            summary_parts.append(
                "Article lacks proper source attribution and citations. "
            )
        
        # Recommendation
        if recommendation == "likely_fake":
            summary_parts.append(
                "Recommendation: Treat this content with high skepticism and verify through trusted sources."
            )
        elif recommendation == "likely_real":
            summary_parts.append(
                "Recommendation: Content appears legitimate, though independent verification is always prudent."
            )
        else:
            summary_parts.append(
                "Recommendation: Exercise caution and cross-reference key claims with authoritative sources."
            )
        
        return ''.join(summary_parts)


def verify_with_hybrid(article_text: str, ml_prediction: str, 
                      ml_confidence: float, url: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function for hybrid verification
    
    Args:
        article_text: The article to verify
        ml_prediction: Your ML model's prediction ("Real" or "Fake")
        ml_confidence: ML model confidence (0-1)
        url: Optional article URL
    
    Returns:
        Comprehensive verification report
    """
    verifier = HybridVerifier(ml_prediction, ml_confidence)
    return verifier.verify_article(article_text, url)
