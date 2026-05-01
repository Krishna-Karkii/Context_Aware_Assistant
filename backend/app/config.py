from pydantic_settings import BaseSettings
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    db_user:     str
    db_password: str
    db_name:     str
    db_host:     str = "localhost"
    db_port:     int = 5432
    jwt_secret:  str
    jwt_expire_minutes: int = 30

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = {"env_file": str(ENV_PATH), "env_file_encoding": "utf-8"}

settings = Settings()