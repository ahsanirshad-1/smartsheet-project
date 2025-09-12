from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT settings
    secret_key: str = "your-secret-key"  # Change this to a secure key
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database settings
    mongo_uri: str = "mongodb://localhost:27017"
    database_name: str = "task_manager"

    # Email settings
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    sender_email: str = "your_email@gmail.com"
    sender_password: str = "your_password"

    # Rate limiting (requests per minute)
    rate_limit_requests: int = 10
    rate_limit_window: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
