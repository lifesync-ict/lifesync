import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


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
