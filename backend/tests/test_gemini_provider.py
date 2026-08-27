import time
from types import SimpleNamespace

import httpx
import pytest
from google.genai import errors

from app.services.fact_analysis.gemini import GeminiFactAnalysisProvider, GeminiFactPayload
from app.services.fact_analysis.service import fact_analysis_service


FULL_SITUATION = (
    "사장님이 2026년 8월 20일에 그만두라고 했고, 필요한 서류를 받지 못했어요. "
    "다른 회사로 옮기고 싶어요."
)


class FakeModels:
    def __init__(self, response=None, error: Exception | None = None):
        self.response = response
        self.error = error
        self.calls = 0
        self.last_config = None

    def generate_content(self, **kwargs):
        self.calls += 1
        self.last_config = kwargs["config"]
        if self.error:
            raise self.error
        return self.response


def fake_client(models):
    return SimpleNamespace(models=models)


def request_analysis(client, profile, text=FULL_SITUATION):
    return client.post("/api/v1/facts/analyze", json={"text": text, "language": "ko", "profile": profile})


def complete_payload() -> GeminiFactPayload:
    return GeminiFactPayload(
        event_type="employer_termination_request",
        occurred_at="2026-08-20",
        actor="employer",
        reason_code="employer_request",
        wants_workplace_change=True,
        documents_provided=False,
        confidence=0.94,
    )


def test_gemini_structured_result_keeps_existing_api_schema(client, profile, monkeypatch):
    models = FakeModels(SimpleNamespace(text=complete_payload().model_dump_json()))
    provider = GeminiFactAnalysisProvider("test-placeholder", "gemini-test-model", client=fake_client(models))
    monkeypatch.setattr(fact_analysis_service, "provider", provider)

    response = request_analysis(client, profile)
    assert response.status_code == 200
    body = response.json()
    candidate = body["eventCandidate"]
    assert candidate["eventType"] == "employer_termination_request"
    assert candidate["occurredAt"] == "2026-08-20"
    assert candidate["actor"] == "employer"
    assert candidate["wantsWorkplaceChange"] is True
    assert candidate["documentsProvided"] is False
    assert [question["factKey"] for question in body["questions"]] == ["employmentContractEndedAt"]
    assert body["warnings"] == []
    assert body["meta"]["verificationStatus"] == "review_required"
    assert models.last_config.response_mime_type == "application/json"
    assert models.last_config.response_json_schema is not None


@pytest.mark.parametrize("response", [
    SimpleNamespace(text="not-json"),
    SimpleNamespace(text='{"event_type":"unsupported"}'),
    SimpleNamespace(text='{"event_type":"contract_end","occurred_at":"2026-99-99","actor":"mutual","reason_code":"contract_end","wants_workplace_change":true,"documents_provided":null,"confidence":0.8}'),
])
def test_invalid_gemini_output_falls_back(client, profile, monkeypatch, response):
    provider = GeminiFactAnalysisProvider("test-placeholder", "gemini-test-model", client=fake_client(FakeModels(response)))
    monkeypatch.setattr(fact_analysis_service, "provider", provider)
    body = request_analysis(client, profile).json()
    assert "ai_response_invalid" in body["warnings"]
    assert "deterministic_fallback_used" in body["warnings"]
    assert body["meta"]["verificationStatus"] == "review_required"


@pytest.mark.parametrize(("error", "expected"), [
    (errors.ClientError(401, {"message": "not exposed"}), "ai_provider_authentication"),
    (errors.ClientError(404, {"message": "not exposed"}), "ai_model_unavailable"),
    (errors.ClientError(429, {"message": "not exposed"}), "ai_provider_quota"),
    (httpx.ConnectError("not exposed"), "ai_provider_network"),
    (RuntimeError("not exposed"), "ai_provider_unavailable"),
])
def test_gemini_exception_classification_is_sanitized(client, profile, monkeypatch, error, expected):
    provider = GeminiFactAnalysisProvider("test-placeholder", "gemini-test-model", client=fake_client(FakeModels(error=error)))
    monkeypatch.setattr(fact_analysis_service, "provider", provider)
    response = request_analysis(client, profile)
    assert response.status_code == 200
    assert expected in response.json()["warnings"]
    assert "deterministic_fallback_used" in response.json()["warnings"]
    assert "not exposed" not in response.text


def test_timeout_uses_fallback(client, profile, monkeypatch):
    class SlowModels:
        def generate_content(self, **kwargs):
            del kwargs
            time.sleep(0.05)
            return SimpleNamespace(text=complete_payload().model_dump_json())

    provider = GeminiFactAnalysisProvider("test-placeholder", "gemini-test-model", timeout_seconds=0.001, client=fake_client(SlowModels()))
    monkeypatch.setattr(fact_analysis_service, "provider", provider)
    body = request_analysis(client, profile).json()
    assert "ai_provider_timeout" in body["warnings"]
    assert "deterministic_fallback_used" in body["warnings"]


def test_missing_gemini_configuration_falls_back(client, profile, monkeypatch):
    monkeypatch.setattr(fact_analysis_service, "provider", GeminiFactAnalysisProvider("", "gemini-test-model"))
    body = request_analysis(client, profile).json()
    assert "ai_provider_not_configured" in body["warnings"]
    assert "deterministic_fallback_used" in body["warnings"]
