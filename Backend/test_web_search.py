"""
Quick test script for web verification
Run this to check if web search is working
"""

from enhanced_hybrid_verifier import EnhancedHybridVerifier
import json

# Test with fake news
test_article = """
BREAKING: Doctors SHOCKED! Drinking Bleach Cures COVID-19 in 24 Hours!

Mainstream media refuses to report this MIRACLE cure!
"""

print("Testing Enhanced Hybrid Verifier with Web Search...")
print("=" * 60)

verifier = EnhancedHybridVerifier(
    ml_prediction="Fake",
    ml_confidence=0.958
)

result = verifier.verify_article(test_article)

print("\n✓ Verification Complete!")
print("=" * 60)

# Check web verification
web_ver = result.get('web_verification', {})
print(f"\nSearches Performed: {web_ver.get('searches_performed', 0)}")
print(f"Corroboration Level: {web_ver.get('corroboration_level', 'NONE')}")
print(f"Sources Found: {len(web_ver.get('sources_found', []))}")
print(f"Fact Check Results: {len(web_ver.get('fact_check_results', []))}")
print(f"News Coverage: {len(web_ver.get('news_coverage', []))}")

print("\n" + "=" * 60)
print("Sources Found:")
for source in web_ver.get('sources_found', []):
    print(f"  - {source.get('source')}: {source.get('title', 'N/A')}")

print("\n" + "=" * 60)
print("Fact-Checker Results:")
for fc in web_ver.get('fact_check_results', []):
    print(f"  - {fc.get('source')}: {fc.get('snippet', 'N/A')[:100]}")

print("\n" + "=" * 60)
print("\nFull Web Verification Object:")
print(json.dumps(web_ver, indent=2))

print("\n" + "=" * 60)
print(f"\nFinal Credibility Score: {result['overall_assessment']['credibility_score']}/100")
print(f"Recommendation: {result['overall_assessment']['recommendation']}")
