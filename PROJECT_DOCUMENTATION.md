# Fake News Detection System - Technical Documentation
## Design Engineering Project - Semester 5

---

## 📋 Project Overview

This is an **academic machine learning project** for detecting fake news using **classical ML techniques**. The system is designed to be simple, explainable, and suitable for viva defense.

### Key Features
- ✅ **Three-state output**: REAL / FAKE / NEEDS VERIFICATION
- ✅ **Explainability**: Shows which words influenced the prediction
- ✅ **Extreme claim detection**: Flags death, war, disaster claims for verification
- ✅ **Source credibility scoring**: Rule-based heuristics for domain trust
- ✅ **Confidence-based routing**: Low confidence cases go to verification
- ✅ **Modern web interface**: React/Next.js frontend with FastAPI backend

---

## 🏗️ Architecture

### Backend (Python FastAPI)
```
Backend/
├── app.py              # FastAPI server and endpoints
├── model.py            # Inference logic with explainability
├── train_model.py      # Training pipeline
├── preprocess.py       # Text cleaning (consistent train/inference)
├── requirements.txt    # Python dependencies
└── model/              # Trained artifacts (created by training)
    ├── lr_model.pkl
    ├── vectorizer.pkl
    └── config.json
```

### Frontend (Next.js + TypeScript)
```
Frontend/
├── app/
│   ├── page.tsx                    # Home page
│   └── actions/analyze-news.ts     # Server action for API calls
└── components/
    ├── news-verification-form.tsx  # Input form
    └── results-display.tsx         # Results with explainability
```

---

## 🧠 Machine Learning Pipeline

### 1. Text Preprocessing (`preprocess.py`)

**Philosophy**: Clean text while **preserving meaning** for explainability.

#### What We Remove:
- URLs (not useful for content analysis)
- HTML tags
- Special characters (emojis, symbols)
- Excessive whitespace

#### What We Preserve:
- **Named entities** (e.g., "Donald Trump", "COVID-19")
- **Phrase structure** (basic punctuation like periods, commas)
- **Context** (don't over-strip text)

```python
def clean_text(text: str) -> str:
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    # Remove HTML tags
    text = re.sub(r'<.*?>', ' ', text)
    # Remove special chars but keep basic punctuation
    text = re.sub(r'[^\w\s.,\'-]', ' ', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()
```

**Critical**: Same preprocessing used in training AND inference (no data leakage).

---

### 2. Feature Engineering

#### A. TF-IDF Features (Text Representation)

**Configuration**:
```python
TfidfVectorizer(
    ngram_range=(1, 2),     # Unigrams + bigrams for phrase capture
    min_df=3,               # Remove rare words (< 3 documents)
    max_df=0.6,             # Remove very common words (> 60% docs)
    max_features=20000,     # Vocabulary size limit
    sublinear_tf=True,      # Log scaling for term frequency
    stop_words='english',   # Remove common English words
    lowercase=True,
    norm='l2',             # L2 normalization
)
```

**Why These Choices?**
- **ngram_range=(1,2)**: Captures phrases like "president trump" not just "president" + "trump"
- **min_df=3**: Removes typos and rare noise
- **max_df=0.6**: Removes overly common words that don't discriminate
- **sublinear_tf**: Prevents very frequent terms from dominating
- **20000 features**: Large enough for rich vocabulary, small enough to avoid overfitting

#### B. Metadata Features (6 features)

1. **caps_ratio**: Proportion of uppercase letters (clickbait indicator)
2. **exclamation_ratio**: Excessive `!` marks (sensationalism)
3. **question_ratio**: Question marks (speculation indicator)
4. **has_url**: Contains links (may indicate sourcing)
5. **trusted_source**: References known credible domains
6. **length_score**: Word count normalized (very short = incomplete)

**Total Features**: 20,000 (TF-IDF) + 6 (metadata) = **20,006 features**

---

### 3. Model Selection

**Choice**: **Logistic Regression** with **Probability Calibration**

**Why Logistic Regression?**
- ✅ **Linear and interpretable**: Can extract feature weights
- ✅ **Works well with TF-IDF**: Standard for text classification
- ✅ **Fast training and inference**: Suitable for academic projects
- ✅ **Probability output**: Enables confidence-based routing
- ✅ **Explainable**: Can show which words influenced decision

**Configuration**:
```python
base_lr = LogisticRegression(
    max_iter=2000,
    class_weight='balanced',  # Handle class imbalance
    random_state=42,
    solver='lbfgs',
)

# Calibrate probabilities for better confidence scores
model = CalibratedClassifierCV(base_lr, cv=3, method='sigmoid')
```

**Performance**:
- **Accuracy**: 98.98%
- **ROC-AUC**: 0.9996
- **Precision/Recall**: 99% for both classes

---

### 4. Three-State Output Logic

#### States:
1. **REAL**: High confidence authentic news
2. **FAKE**: High confidence fabricated/misleading news
3. **NEEDS VERIFICATION**: Low confidence OR extreme claim

#### Decision Logic:

```python
CONFIDENCE_THRESHOLD_HIGH = 0.75  # Above = confident prediction
CONFIDENCE_THRESHOLD_LOW = 0.55   # Below = needs verification

if is_extreme_claim and adjusted_confidence < 0.85:
    label = "NEEDS VERIFICATION"
    # Extreme claims need very high confidence
    
elif adjusted_confidence >= CONFIDENCE_THRESHOLD_HIGH:
    label = "REAL" or "FAKE"  # Based on ML prediction
    
elif adjusted_confidence < CONFIDENCE_THRESHOLD_LOW:
    label = "NEEDS VERIFICATION"
    
else:
    label = "REAL" or "FAKE"  # Medium confidence
```

**Extreme Claim Detection**:
- Keywords: `dead, died, death, killed, arrested, war, bombing, pandemic, disaster, coup, scandal`
- If detected: Reduce confidence by 30%
- Rationale: Extraordinary claims require extraordinary evidence

---

### 5. Explainability (TF-IDF Feature Weights)

**How It Works**:

1. Get Logistic Regression coefficients (weights) for each word
2. For input text, identify which words are present
3. Calculate: `contribution = coefficient × TF-IDF_score`
4. Sort by absolute contribution
5. Return top 5 words/phrases

**Example**:
```
Input: "President announces new economic policy"
Top Features: ["president", "announces", "economic policy", "new policy", "announces new"]
```

**Why This Matters**:
- **Transparency**: Users see what drove the decision
- **Trust**: Builds confidence in the system
- **Debugging**: Helps identify model biases
- **Viva Defense**: Easy to explain in oral exams

---

### 6. Source Credibility Heuristic

**Rule-Based Scoring** (0.0 to 1.0):

| Factor | Score Change | Rationale |
|--------|--------------|-----------|
| References trusted domain (BBC, Reuters, .gov, .edu) | +0.3 | Established credible sources |
| Contains URL | +0.1 | Shows sourcing attempt |
| Excessive capitalization (>30%) | -0.2 | Clickbait indicator |
| Excessive exclamation (>3) | -0.2 | Sensationalism |
| Very short text (<10 words) | -0.1 | Incomplete context |

**Important**: This is a **supportive heuristic**, NOT replacing ML prediction. Used to enrich the explanation.

---

## 🔄 Training Pipeline

### Step-by-Step Process

1. **Load Data**
   - Fake.csv (23,481 articles)
   - True.csv (21,417 articles)
   - Total: 44,898 samples

2. **Preprocess**
   - Apply `clean_text()` to all articles
   - Extract metadata features

3. **Feature Engineering**
   - Fit TF-IDF vectorizer on **training data only**
   - Combine TF-IDF + metadata features

4. **Train/Test Split**
   - 80% training (35,918 samples)
   - 20% testing (8,980 samples)
   - **Stratified**: Preserves class balance

5. **Train Model**
   - Logistic Regression with calibration
   - 3-fold cross-validation for probability calibration

6. **Evaluate**
   - Accuracy, precision, recall, F1-score
   - ROC-AUC for probability quality
   - Confusion matrix

7. **Save Artifacts**
   - `lr_model.pkl`: Trained model
   - `vectorizer.pkl`: Fitted TF-IDF vectorizer
   - `config.json`: Metadata (vocab size, feature names)

### Running Training

```bash
cd Backend
python train_model.py
```

**Output**:
```
Accuracy: 0.9898
ROC-AUC: 0.9996
Classification Report:
              precision    recall  f1-score   support
        FAKE       0.99      0.99      0.99      4696
        REAL       0.99      0.99      0.99      4284
```

---

## 🚀 Inference Pipeline

### Request Flow

```
User Input
    ↓
Clean Text (preprocess.py)
    ↓
Extract Metadata Features
    ↓
TF-IDF Transform (using saved vectorizer)
    ↓
Combine Features
    ↓
Model Prediction (Logistic Regression)
    ↓
Credibility Scoring (heuristic)
    ↓
Extreme Claim Detection
    ↓
Confidence Adjustment
    ↓
Three-State Label Assignment
    ↓
Explainability Extraction
    ↓
Return JSON Response
```

### API Response Format

```json
{
  "prediction": "NEEDS VERIFICATION",
  "confidence": 70,
  "ml_prediction": "FAKE",
  "ml_confidence": 92,
  "explanation": "Contains extreme claim (dead). Manual verification strongly recommended.",
  "top_features": ["trump", "dead", "president", "announces", "breaking news"],
  "credibility_score": 30,
  "credibility_explanation": "excessive capitalization; no trusted source",
  "is_extreme_claim": true,
  "extreme_keywords": ["dead"]
}
```

---

## 🎯 Test Cases

### Test 1: Extreme Claim
**Input**: `"Donald Trump is dead"`

**Expected Behavior**:
- Detects keyword: "dead"
- Reduces confidence by 30%
- Routes to "NEEDS VERIFICATION"
- Returns extreme_keywords: ["dead"]

**Actual Result**: ✅ PASS
```
Label: NEEDS VERIFICATION
Confidence: 70%
Extreme: True
Explanation: Contains extreme claim (dead). Manual verification strongly recommended.
```

### Test 2: Trusted Source
**Input**: `"According to BBC News, economic growth continues"`

**Expected Behavior**:
- Detects trusted source: "BBC"
- Increases credibility score
- High confidence prediction

### Test 3: Low Confidence
**Input**: `"Something happened"`

**Expected Behavior**:
- Very short text
- Low metadata scores
- Routes to "NEEDS VERIFICATION"

---

## 📊 Model Performance

### Metrics on Test Set (8,980 samples)

| Metric | Value |
|--------|-------|
| **Accuracy** | 98.98% |
| **Precision (FAKE)** | 99% |
| **Precision (REAL)** | 99% |
| **Recall (FAKE)** | 99% |
| **Recall (REAL)** | 99% |
| **F1-Score** | 99% |
| **ROC-AUC** | 0.9996 |

### Confusion Matrix

```
              Predicted
              FAKE   REAL
Actual FAKE   4639    57
       REAL     35  4249
```

**False Positives** (Real labeled as Fake): 57 (1.2%)
**False Negatives** (Fake labeled as Real): 35 (0.7%)

---

## 🛡️ Academic Integrity Considerations

### What We Did NOT Use:
- ❌ Deep Learning (BERT, RoBERTa, Transformers)
- ❌ Pretrained Language Models
- ❌ AutoML or Neural Architecture Search
- ❌ External APIs (GPT, fact-checking services)
- ❌ Web scraping for real-time verification

### What We Used (Academically Appropriate):
- ✅ Classical ML (Logistic Regression)
- ✅ TF-IDF (standard bag-of-words)
- ✅ Rule-based heuristics (transparent)
- ✅ Feature engineering (explainable)
- ✅ Probability calibration (standard technique)

### Design Choices Rationale:
1. **Simple > Complex**: Logistic Regression over ensemble methods
2. **Explainable > Accurate**: Chose interpretability even if ensemble might be slightly better
3. **Transparent > Black Box**: All decisions can be explained in viva
4. **Academic > Production**: Focused on learning, not deployment optimization

---

## 🔧 Setup and Running

### Backend Setup

```bash
# Install dependencies
cd Backend
pip install -r requirements.txt

# Train the model (must run first)
python train_model.py

# Start the API server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Install dependencies
cd Frontend
npm install  # or pnpm install

# Set backend URL (optional)
export BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📝 Viva Defense Talking Points

### 1. Why Logistic Regression?
**Answer**: "Logistic Regression is ideal for text classification because:
- Linear model allows us to extract feature weights (explainability)
- Proven effective for bag-of-words representations like TF-IDF
- Outputs calibrated probabilities for confidence scoring
- Fast training and inference
- Industry standard for baseline text classification"

### 2. Why not use BERT or transformers?
**Answer**: "While transformers would give higher accuracy, we prioritized:
- **Explainability**: We can show exactly which words drove each decision
- **Resource efficiency**: Runs on modest hardware
- **Academic appropriateness**: Classical ML is more suitable for 5th semester
- **Viva defensibility**: We can explain every component clearly"

### 3. How do you handle extreme claims like "X is dead"?
**Answer**: "We use a multi-layered approach:
- **Keyword detection**: Flag words like 'dead', 'war', 'arrested'
- **Confidence reduction**: Lower confidence by 30% for extreme claims
- **Threshold routing**: Route to 'NEEDS VERIFICATION' unless confidence >85%
- **Rationale**: Extraordinary claims require extraordinary evidence"

### 4. What prevents data leakage?
**Answer**: "We ensure consistency through:
- **Same preprocessing**: `clean_text()` used in train AND inference
- **Saved vectorizer**: TF-IDF fit only on training data, reused in inference
- **Stratified split**: Maintains class balance in train/test
- **No test data in training**: Clear separation maintained"

### 5. How do you explain predictions?
**Answer**: "Using TF-IDF feature weights:
- Extract Logistic Regression coefficients
- Identify words present in input
- Calculate contribution: coefficient × TF-IDF score
- Return top 5 contributing words/phrases
- Show these to user for transparency"

### 6. Why three states instead of binary?
**Answer**: "Real-world applicability:
- **Low confidence**: Model is uncertain → human verification needed
- **Extreme claims**: Require extra scrutiny → flag for review
- **User trust**: Admitting uncertainty builds credibility
- **Practical**: Aligns with how real fact-checking works"

---

## 🐛 Known Limitations

1. **Dataset Dependency**: Model is only as good as training data
2. **No Real-Time Updates**: Doesn't know about very recent events
3. **English Only**: No multilingual support
4. **Context Limited**: Can't verify claims against external sources
5. **Adversarial Attacks**: Could be fooled by carefully crafted text

**Mitigation**: Always encourage users to verify through multiple trusted sources.

---

## 📚 Technologies Used

### Backend
- **Python 3.10+**
- **FastAPI**: Modern async web framework
- **scikit-learn**: ML library (Logistic Regression, TF-IDF)
- **pandas**: Data manipulation
- **numpy**: Numerical operations
- **scipy**: Sparse matrix operations

### Frontend
- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **Shadcn UI**: Component library

---

## 📖 References

1. TF-IDF: Salton & McGill (1986), "Introduction to Modern Information Retrieval"
2. Logistic Regression: Hosmer & Lemeshow (2000), "Applied Logistic Regression"
3. Probability Calibration: Platt (1999), "Probabilistic Outputs for SVMs"
4. Fake News Detection: Shu et al. (2017), "Fake News Detection on Social Media"

---

## ✅ Project Checklist

- [x] Text preprocessing (consistent train/inference)
- [x] TF-IDF with ngrams (1,2)
- [x] Feature engineering (metadata)
- [x] Model training (Logistic Regression)
- [x] Probability calibration
- [x] Three-state output (REAL/FAKE/NEEDS VERIFICATION)
- [x] Explainability (top TF-IDF features)
- [x] Extreme claim detection
- [x] Source credibility heuristic
- [x] API implementation (FastAPI)
- [x] Frontend integration (Next.js)
- [x] Comprehensive documentation
- [x] Viva defense preparation

---

## 🎓 Conclusion

This project demonstrates a **production-ready fake news detection system** using **classical machine learning techniques**. It prioritizes **explainability**, **academic integrity**, and **practical usability** over raw performance.

The system is designed to be:
- ✅ **Explainable**: Every decision can be traced and understood
- ✅ **Academically sound**: Uses appropriate techniques for 5th semester
- ✅ **Viva-defensible**: All choices have clear rationale
- ✅ **Practically useful**: Three-state output matches real-world needs
- ✅ **Professionally implemented**: Clean code, modular design, comprehensive docs

**Perfect for**: Design Engineering academic project, viva defense, portfolio showcase.

---

**Date**: December 29, 2025
**Version**: 2.0.0
**Author**: Design Engineering Team
**Status**: ✅ Production Ready
