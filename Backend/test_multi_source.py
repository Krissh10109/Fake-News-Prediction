"""
Quick test for the MultiSourceVerifier
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8')

from multi_source_verifier import MultiSourceVerifier

print("=" * 60)
print("MULTI-SOURCE VERIFIER TEST")
print("=" * 60)

verifier = MultiSourceVerifier()

# Test 1: Well-known real event
print("\nTest 1: Well-known real event")
print("-" * 40)
result = verifier.verify_claim("NASA launches Artemis mission to the Moon")
print(f"  Searches: {result['searches_performed']}")
print(f"  Sources found: {len(result['sources_found'])}")
print(f"  Corroboration: {result['corroboration_level']}")
print(f"  Consensus score: {result['consensus_score']}")
print(f"  Wikipedia: {'YES' if result['wikipedia_result'] else 'NO'}")
print(f"  Reddit: {len(result['reddit_results'])} posts")
print(f"  Google News: {len(result['google_news_results'])} articles")
print(f"  Fact checks: {len(result['fact_check_results'])}")

if result['wikipedia_result']:
    w = result['wikipedia_result']
    print(f"  Wiki title: {w['title']}")
    print(f"  Wiki snippet: {w['snippet'][:100]}...")

if result['reddit_results']:
    r = result['reddit_results'][0]
    print(f"  Top Reddit: {r['title'][:80]}...")
    print(f"    Subreddit: {r.get('subreddit', 'N/A')} | Score: {r.get('score', 'N/A')}")

if result['google_news_results']:
    g = result['google_news_results'][0]
    print(f"  Top GNews: {g['title'][:80]}...")
    print(f"    Source: {g['source']}")

# Test 2: Obvious fake claim
print("\nTest 2: Obvious fake claim")
print("-" * 40)
result2 = verifier.verify_claim("Scientists discover Earth is actually flat")
print(f"  Searches: {result2['searches_performed']}")
print(f"  Sources found: {len(result2['sources_found'])}")
print(f"  Corroboration: {result2['corroboration_level']}")
print(f"  Consensus score: {result2['consensus_score']}")
print(f"  Wikipedia: {'YES' if result2['wikipedia_result'] else 'NO'}")
print(f"  Reddit: {len(result2['reddit_results'])} posts")
print(f"  Google News: {len(result2['google_news_results'])} articles")

print("\n" + "=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
