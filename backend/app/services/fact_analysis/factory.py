from app.core.config import Settings, get_settings
from app.services.fact_analysis.base import FactAnalysisProvider
from app.services.fact_analysis.deterministic import DeterministicFactAnalysisProvider
from app.services.fact_analysis.gemini import GeminiFactAnalysisProvider


def create_fact_analysis_provider(settings: Settings | None = None) -> FactAnalysisProvider:
    selected = settings or get_settings()
    if selected.normalized_ai_provider == "gemini":
        return GeminiFactAnalysisProvider(
            api_key=selected.ai_api_key.get_secret_value(),
            model=selected.ai_model,
            timeout_seconds=selected.ai_timeout_seconds,
            development=selected.app_env.strip().casefold() == "development",
        )
    return DeterministicFactAnalysisProvider()
