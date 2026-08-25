import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.services.fact_analysis.deterministic import DeterministicFactAnalysisProvider
from app.services.fact_analysis.service import fact_analysis_service


@pytest.fixture(autouse=True)
def disable_external_ai(monkeypatch):
    deterministic = DeterministicFactAnalysisProvider()
    monkeypatch.setattr(fact_analysis_service, "provider", deterministic)
    monkeypatch.setattr(fact_analysis_service, "fallback_provider", deterministic)


@pytest.fixture
def cors_origin() -> str:
    return "http://localhost:5174"


@pytest.fixture
def client(cors_origin: str):
    settings = Settings(
        _env_file=None,
        ai_provider="deterministic",
        ai_api_key="",
        ai_model="",
        cors_origins=cors_origin,
    )
    with TestClient(create_app(settings), raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture
def profile() -> dict[str, str]:
    return {"visaType": "E-9", "nationality": "VN", "region": "충북 음성군", "industry": "제조업"}


@pytest.fixture
def confirmed_facts() -> dict[str, object]:
    return {
        "eventType": "contract_end", "occurredAt": "2026-08-20", "actor": "mutual",
        "reasonCode": "contract_end", "wantsWorkplaceChange": True, "documentsProvided": False,
        "sourceText": "계약이 끝났는데 다른 회사로 옮기고 싶어요", "confirmationStatus": "user_confirmed",
    }
