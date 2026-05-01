# 🚀 Fake News Detection System

A complete AI-based Fake News Detection Web Application built for academic purposes.

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Accuracy](https://img.shields.io/badge/accuracy-91.84%25-green)

## 📋 Overview

This system analyzes news articles or text content and classifies them as **Real**, **Fake**, or **Needs Verification** with confidence scores and explainability.

### Features
- ✅ TF-IDF + Logistic Regression ML model (91.84% accuracy)
- ✅ FastAPI backend with `/predict` endpoint
- ✅ Modern Next.js frontend with dark mode
- ✅ Confidence gauge and keyword explanations
- ✅ Docker support for easy deployment

---

## ⚡ Quick Start

### Option 1: Local Development

#### Prerequisites
- Python 3.10+
- Node.js 18+
- pip & npm

#### Step 1: Backend Setup
```powershell
cd K:\Semester-5\D.E\fake-news-detection-website

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r Backend/requirements.txt

# Train the model (first time only, ~2-3 minutes)
python Backend/train_model.py
```

#### Step 2: Start Backend
```powershell
uvicorn Backend.app:app --reload --host 0.0.0.0 --port 8000
```
✅ Verify: http://localhost:8000

#### Step 3: Start Frontend (New Terminal)
```powershell
cd Frontend
npm install
npm run dev
```
✅ Verify: http://localhost:3000

---

### Option 2: Docker Deployment 🐳

```powershell
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

✅ Frontend: http://localhost:3000
✅ Backend API: http://localhost:8000

#### Docker Commands
```powershell
# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build
```

---

## 🧪 Test Cases

### 1. Fake News Detection
**Input:** `"Miracle cure for cancer discovered! Doctors hate this one weird trick!"`
- Expected Label: **FAKE**
- Confidence: 85-95%

### 2. Real News Detection
**Input:** `"According to BBC News, economic indicators show steady growth in Q4"`
- Expected Label: **REAL**
- Confidence: 85-95%

### 3. Needs Verification
**Input:** `"Donald Trump is dead"`
- Expected Label: **NEEDS VERIFICATION**
- Confidence: 60-75%

---

## 📁 Project Structure

```
fake-news-detection-website/
├── Backend/
│   ├── app.py              # FastAPI server
│   ├── model.py            # Inference & explainability
│   ├── train_model.py      # Training pipeline
│   ├── preprocess.py       # Text cleaning
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   ├── data/               # Training datasets
│   └── model/              # Trained model files
├── Frontend/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── Dockerfile          # Frontend container
│   └── package.json        # Node dependencies
├── docker-compose.yml      # Container orchestration
└── README.md
```

---

## 📊 API Reference

### Health Check
```bash
GET http://localhost:8000/
```

### Predict
```bash
POST http://localhost:8000/predict
Content-Type: application/json

{
  "text": "Your news article here..."
}
```

**Response:**
```json
{
  "label": "FAKE",
  "confidence": 0.87,
  "explanation_keywords": ["miracle", "cure", "doctors"],
  "source_credibility": {
    "score": 0.3,
    "factors": "Sensational language detected"
  }
}
```

---

## 🎓 For Viva/Demo

### Recommended Demo Flow
1. Show system architecture (Backend + Frontend separation)
2. Demo all 3 test cases
3. Explain TF-IDF features and confidence gauge
4. Show `train_model.py` and discuss model choice
5. Demonstrate Docker deployment

### Key Technical Points
- **Model:** Logistic Regression with CalibratedClassifierCV
- **Features:** TF-IDF (1-3 ngrams) + metadata features
- **Accuracy:** 91.84% on balanced test set
- **ROC-AUC:** 97.60%

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing model artifacts | Run `python Backend/train_model.py` |
| Port 8000 in use | Use `--port 8001` and update frontend env |
| Module not found | Activate venv and reinstall requirements |
| Docker build fails | Ensure Docker Desktop is running |

---

## 📦 Tech Stack

**Backend:** Python, FastAPI, scikit-learn, pandas, numpy

**Frontend:** Next.js 14, React, TypeScript, Tailwind CSS

**ML:** TF-IDF Vectorization, Logistic Regression, CalibratedClassifierCV

---

**Status:** ✅ Ready for Demo | **Last Updated:** February 2026
