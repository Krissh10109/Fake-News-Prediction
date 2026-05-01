import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase once
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

class FirestoreService:
    def __init__(self):
        self.collection = db.collection("verified_articles")

    async def save_verification(self, verdict, text, url=None):
        data = {
            "verdict": verdict,
            "text": text,
            "url": url,
            "timestamp": datetime.utcnow()
        }
        doc_ref = self.collection.document()
        doc_ref.set(data)
        return doc_ref.id

    def get_live_feed(self, limit=50):
        docs = (
            self.collection
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )

        return [{**doc.to_dict(), "id": doc.id} for doc in docs]