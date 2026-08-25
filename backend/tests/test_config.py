from pathlib import Path

from app.core.config import BACKEND_DIR, ENV_FILE, Settings


ENV_NAMES = ("AI_PROVIDER", "AI_API_KEY", "AI_MODEL", "CORS_ORIGINS")


def clear_ai_environment(monkeypatch):
    for name in ENV_NAMES:
        monkeypatch.delenv(name, raising=False)


def write_env(path: Path, provider: str = "  GeMiNi  ") -> None:
    path.write_text(
        f"AI_PROVIDER={provider}\n"
        "AI_API_KEY=test-secret-value\n"
        "AI_MODEL=gemini-test-model\n"
        "CORS_ORIGINS=http://localhost:5173\n",
        encoding="utf-8",
    )


def test_default_env_path_is_backend_absolute_path():
    assert ENV_FILE == BACKEND_DIR / ".env"
    assert ENV_FILE.is_absolute()


def test_gemini_settings_load_from_env_file(tmp_path, monkeypatch):
    clear_ai_environment(monkeypatch)
    env_file = tmp_path / ".env"
    write_env(env_file)
    settings = Settings(_env_file=env_file)
    assert settings.normalized_ai_provider == "gemini"
    assert settings.ai_provider_configured is True


def test_env_loading_does_not_depend_on_working_directory(tmp_path, monkeypatch):
    clear_ai_environment(monkeypatch)
    env_file = tmp_path / "config" / ".env"
    env_file.parent.mkdir()
    write_env(env_file)
    other_directory = tmp_path / "working-directory"
    other_directory.mkdir()
    monkeypatch.chdir(other_directory)
    settings = Settings(_env_file=env_file.resolve())
    assert settings.normalized_ai_provider == "gemini"
    assert settings.ai_provider_configured is True


def test_deterministic_is_safe_default_without_env(monkeypatch):
    clear_ai_environment(monkeypatch)
    settings = Settings(_env_file=None)
    assert settings.normalized_ai_provider == "deterministic"
    assert settings.ai_provider_configured is True


def test_system_environment_takes_priority_over_dotenv(tmp_path, monkeypatch):
    clear_ai_environment(monkeypatch)
    env_file = tmp_path / ".env"
    write_env(env_file)
    monkeypatch.setenv("AI_PROVIDER", " deterministic ")
    settings = Settings(_env_file=env_file)
    assert settings.normalized_ai_provider == "deterministic"


def test_secret_is_not_exposed_by_settings_representation(tmp_path, monkeypatch):
    clear_ai_environment(monkeypatch)
    env_file = tmp_path / ".env"
    write_env(env_file)
    settings = Settings(_env_file=env_file)
    assert settings.ai_api_key.get_secret_value() not in repr(settings)


def test_ready_reports_gemini_without_exposing_secret(client, tmp_path, monkeypatch):
    clear_ai_environment(monkeypatch)
    env_file = tmp_path / ".env"
    write_env(env_file)
    settings = Settings(_env_file=env_file)
    monkeypatch.setattr(client.app.state, "settings", settings)
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    assert response.json()["provider"] == "gemini"
    assert response.json()["providerConfigured"] is True
    assert settings.ai_api_key.get_secret_value() not in response.text
