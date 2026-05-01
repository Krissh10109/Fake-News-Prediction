import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

doc_ref = db.collection("test").document("sample")
doc_ref.set({"message": "Firestore connected successfully"})

print("Data written successfully!")