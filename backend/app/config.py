from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SmartDietAI"
    DATABASE_URL: str = "sqlite:///./data/db/smartdiet.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
