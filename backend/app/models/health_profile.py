from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class HealthProfile(Base):
    __tablename__ = "health_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    allergies = Column(String)       # e.g. "peanuts,gluten"
    diseases = Column(String)        # e.g. "diabetes,hypertension"
    dietary_pref = Column(String)    # e.g. "vegan,low-carb"
    calorie_goal = Column(Integer)
