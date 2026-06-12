import pickle
import os

MODEL_PATH = os.path.join("models", "recommender.pkl")

def get_recommendations(user_id: int):
    # TODO: load model and return top-N meal IDs
    # model = pickle.load(open(MODEL_PATH, "rb"))
    return ["meal_001", "meal_042", "meal_078"]
