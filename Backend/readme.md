# Fake News Detection API

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:
	```bash
	pip install -r requirements.txt
	```
3. Train the models (saves artifacts into `model/`):
	```bash
	python train_model.py
	```
4. Serve the API:
	```bash
	uvicorn app:app --host 0.0.0.0 --port 8000 --reload
	```

## Endpoints

- `GET /` – health/meta check.
- `POST /predict` – body `{ "text": "..." }` → `{ prediction, confidence, explanation }`.

## Notes

- Re-run training if you update the dataset in `data/`.
- Set `BACKEND_URL` in the frontend to point at this API (e.g., `http://localhost:8000`).
