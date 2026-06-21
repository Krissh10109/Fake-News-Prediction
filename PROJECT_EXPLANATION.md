# 🚀 Presentation & Viva Guide: Fake News Detection System

This document is designed to help you explain this project to evaluators, professors, or colleagues. It covers **what** the project is, **why** it was built (the problem statement), **how** it works technically, and **common Q&A / Viva questions**.

---

## 📢 The 1-Minute "Elevator Pitch"

> *"Our project is an **Explainable AI-based Fake News Detection System**. Unlike traditional systems that act as 'black boxes' and give a simple True/False answer, our system does two unique things: first, it has a **three-state output** (Real, Fake, or **Needs Verification** for low-confidence cases); and second, it provides **explainability** by showing the user the exact words that influenced the AI's decision. We built the backend using **FastAPI** and **scikit-learn**, achieving a **91.84% accuracy** on a balanced dataset of 45,000+ articles, and connected it to a modern **Next.js** dashboard."*

---

## ⚠️ The Problem Statement (What are we solving?)

1. **The Speed of Misinformation**: Fake news spreads 6 times faster than real news, leading to public panic, financial manipulation, and political polarization.
2. **The "Black-Box" Trust Deficit**: Standard AI models give a verdict (e.g., "90% Fake") but cannot explain *why*. Users are forced to blindly trust the AI.
3. **The Binary Classifier Trap**: Standard models must choose between "Real" or "Fake" even if they are only 51% confident. In the real world, forcing a guess on borderline cases spreads more confusion.
4. **Extraordinary Claims**: Social media is filled with unverified extreme claims (e.g., *"A politician was arrested"* or *"A celebrity died"*). These require extraordinary evidence and shouldn't be verified with simple word matching alone.

---

## 💡 Our Solution & Core Innovations

We solved these problems by introducing a transparent, multi-layered pipeline:

* **Three-State Classifier**:
  * **REAL**: High-confidence authentic news.
  * **FAKE**: High-confidence fabricated news.
  * **NEEDS VERIFICATION**: Low-confidence cases OR extreme claims.
* **Explainability Engine**: Extracts the model's mathematical coefficients for the input words, calculating which specific words pushed the prediction towards Fake or Real.
* **Extreme Claim Guardrails**: Heuristic keyword scanner (e.g., `dead`, `killed`, `war`, `coup`) that automatically demotes confidence scores by 30% to trigger the "Needs Verification" state.
* **Source Credibility Heuristics**: Analyzes writing style indicators (excessive capitalization, exclamation marks, URL presence) to calculate a supportive source credibility score.

---

## 🛠️ Tech Stack & Architecture

```
                 +-----------------------------------------+
                 |            NEXT.JS FRONTEND             |
                 |  - UI Form (Submit news text)           |
                 |  - Confidence Gauges (Visual)           |
                 |  - Keyword Highlight Charts (Explain)   |
                 +-----------------------------------------+
                                      |
                                      | HTTP POST /predict
                                      v
                 +-----------------------------------------+
                 |             FASTAPI BACKEND             |
                 |  - Receives text -> cleans and tokenizes|
                 |  - Combines TF-IDF + Metadata features  |
                 |  - Executes Calibrated ML model         |
                 |  - Runs Heuristics (Extreme claims)     |
                 +-----------------------------------------+
```

* **Frontend**: Next.js 14/15, React, TypeScript, Tailwind CSS, Shadcn UI.
* **Backend**: Python, FastAPI (for high performance and async endpoint support).
* **Machine Learning**: `scikit-learn`, `pandas`, `numpy`, `scipy`.

---

## 🧠 The Machine Learning Pipeline

### 1. Data Collection & Preprocessing
* **Dataset**: We merged and balanced 45,132 articles from the **ISOT Dataset** and **FakeNewsNet** (PolitiFact and GossipCop).
* **Balancing**: Standardized to a perfect **50% Real / 50% Fake** split to prevent the model from biasing towards one class.
* **Cleaning (`preprocess.py`)**: Removes HTML tags, URLs, and emojis, but **preserves named entities** (e.g., "Donald Trump", "BBC") and sentence structure, which are crucial for explainability.

### 2. Feature Engineering (20,006 Total Features)
* **Text Features (20,000)**: TF-IDF (Term Frequency-Inverse Document Frequency) using unigrams and bigrams (e.g., "president", "white house").
* **Metadata Heuristics (6)**:
  1. **caps_ratio**: Percentage of capitalized letters (flags clickbait/screaming headlines).
  2. **exclamation_ratio**: Use of `!` (flags sensationalism).
  3. **question_ratio**: Use of `?` (flags speculation).
  4. **has_url**: Indicates whether sources were cited.
  5. **trusted_source**: Checks if trusted domains like BBC, Reuters, `.gov`, or `.edu` are mentioned.
  6. **length_score**: Normalized length of the article (very short text is harder to classify).

### 3. Model & Probability Calibration
* We chose **Logistic Regression** paired with **CalibratedClassifierCV** (Platt Scaling).
* **Why Logistic Regression?** It is linear, making it highly interpretable. We can inspect the exact mathematical "weights" (coefficients) of each word to explain the output.
* **Why Calibration?** Default models output raw decision values that aren't true probabilities. Calibration ensures that a "90% confidence" score actually represents a 90% likelihood of correctness.

---

## 🎓 Viva Questions & Answers (Be Prepared!)

### Q1: Why did you use Logistic Regression instead of Deep Learning (like BERT or LSTMs)?
**Answer**: 
1. **Explainability**: Deep learning models are black boxes. In Logistic Regression, we can directly extract word coefficients and show the user exactly which terms (like "breaking news", "miracle", or "reuters") influenced the score.
2. **Resource Efficiency**: It trains in under 2 minutes and runs inference in milliseconds on basic hardware, making it highly efficient.
3. **Academic Suitability**: For a 5th-semester project, classical machine learning represents a solid foundation in feature engineering and data preprocessing.

### Q2: What is the benefit of the "Needs Verification" state?
**Answer**: 
In the real world, forcing a binary label on an uncertain piece of text creates false security. If the model is only 52% confident, telling a user "This is REAL" is dangerous. By routing low-confidence predictions (between 50% and 55%) or extreme claims with insufficient certainty to **Needs Verification**, we mimic actual journalistic fact-checking workflows.

### Q3: How does your explainability engine work?
**Answer**: 
When a user inputs text, the backend tokenizes it and extracts the words present. It matches these words against the saved Logistic Regression model weights. 
$$\text{Contribution} = \text{Model Coefficient} \times \text{TF-IDF Score of Word}$$
We sort these contributions and return the top 5 words that pushed the prediction towards "Fake" or "Real" to show them in the UI.

### Q4: How did you prevent Data Leakage?
**Answer**:
1. **Separation**: The TF-IDF Vectorizer was fitted **only** on the training dataset (80% of data) and saved. During real-time inference, we transform the new text using this pre-fitted vectorizer instead of fitting it again.
2. **Consistent Preprocessing**: The exact same `clean_text()` function is used during training and online prediction.

### Q5: What are the limitations of this system?
**Answer**:
1. **No Real-Time Knowledge**: The ML model relies on the historical training dataset. It doesn't know about news events that occurred after the training date.
2. **English Only**: The TF-IDF vocabulary is built around English text.
3. **Context Sensitivity**: Sarcasm or highly nuanced political writing can occasionally trigger false positives, which is why we include the "Needs Verification" safety net.

---

## 🔮 Future Scope & Areas of Improvement (How to scale this project)

If you are asked, *"How would you improve this project in the next phase?"*, here are the 6 key enhancements you can pitch:

### 1. Hybrid ML + Deep Learning (Transformers)
* **Goal**: Upgrade accuracy and contextual understanding.
* **Details**: Replace or combine Logistic Regression with a lightweight transformer model (e.g., **DistilBERT** or **RoBERTa**). This helps the model understand word order, context, negation (e.g., "not bad"), and sarcasm, which classical bag-of-words (TF-IDF) models struggle with.

### 2. Multi-Modal Verification (Image & Video Analysis)
* **Goal**: Detect multimedia-based fake news and Deepfakes.
* **Details**: Fake news is rarely just text; it often contains photoshopped images or deepfakes. Adding a computer vision model (or utilizing Reverse Image Search APIs) to verify the authenticity of associated images would make this a complete media scanner.

### 3. Real-Time Web Search & Fact-Check APIs
* **Goal**: Validate claims about recent events.
* **Details**: Integrate search APIs (like Google Custom Search or Google Fact Check Explorer API). When a news article returns a "Needs Verification" tag, the system can automatically query the web to check if reputable organizations (BBC, Reuters, Snopes, FactCheck.org) have already verified or debunked the claim.

### 4. Multilingual & Regional Language Support
* **Goal**: Combat local and regional misinformation.
* **Details**: Extend the preprocessing and training pipeline to support other major languages by using multilingual transformers (like `mBERT` or `XLM-RoBERTa`) or integrating an automated translation service prior to feeding the text into the model.

### 5. Browser Extension for Active Scanning
* **Goal**: Bring the tool directly to the user's daily workflow.
* **Details**: Build a Chrome/Firefox browser extension. Instead of users manually copy-pasting news into our web app, the extension could highlight text on social media feeds (like Twitter/X or Facebook) and display a confidence tool-tip inline.

### 6. Active Learning / User Feedback Loop
* **Goal**: Continuously improve model performance over time.
* **Details**: Add a *"Report Incorrect Prediction"* button in the frontend. When users report errors, the flagged text is stored in a database, allowing engineers to review, label, and retrain the machine learning model on a monthly basis to adapt to new styles of fake news.
