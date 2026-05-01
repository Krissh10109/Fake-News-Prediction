import json
import sys
import urllib.request


def post_predict(text: str):
    url = "http://localhost:8000/predict"
    body = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def assert_contract(resp: dict):
    required_top = {"label", "confidence", "explanation_keywords", "source_credibility"}
    missing = required_top - set(resp.keys())
    if missing:
        raise AssertionError(f"Missing keys: {sorted(missing)}; got keys={sorted(resp.keys())}")

    sc = resp["source_credibility"]
    if not isinstance(sc, dict) or "score" not in sc or "factors" not in sc:
        raise AssertionError(f"Invalid source_credibility shape: {sc!r}")


def main():
    cases = [
        "BREAKING NEWS!!! Doctors HATE this one weird trick!!!",
        "Same input with trailing spaces    ",
        "Same input with newline\n",
    ]

    for i, text in enumerate(cases, 1):
        r1 = post_predict(text)
        r2 = post_predict(text)
        assert_contract(r1)
        assert_contract(r2)

        identical = r1 == r2
        print(f"\nCase {i}: identical={identical}")
        print(f"text_repr={text!r}")
        print("response=", json.dumps(r1, indent=2, sort_keys=True))

        if not identical:
            raise AssertionError("Backend returned different results for identical input")

    print("\nOK: backend contract + stability verified")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)
