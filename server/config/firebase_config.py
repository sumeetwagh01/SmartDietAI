import firebase_admin
from firebase_admin import auth, credentials, firestore

from config.settings import settings


def init_firebase():
    if not firebase_admin._apps:
        credential = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        firebase_admin.initialize_app(credential)
    return firebase_admin.get_app()


def get_db():
    return firestore.client()


def get_auth():
    return auth
