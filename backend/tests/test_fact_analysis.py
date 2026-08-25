import pytest

from app.services.fact_analysis.deterministic import extract_date


def analyze(client, profile, text):
    return client.post("/api/v1/facts/analyze", json={"text": text, "language": "ko", "profile": profile})


@pytest.mark.parametrize("text", ["   ", "a" * 1001])
def test_invalid_text_is_rejected(client, profile, text):
    response = analyze(client, profile, text)
    assert response.status_code == 422


def test_contract_end_and_only_missing_facts_are_asked(client, profile):
    response = analyze(client, profile, "계약이 끝났는데 다른 회사로 옮기고 싶어요")
    assert response.status_code == 200
    body = response.json()
    candidate = body["eventCandidate"]
    assert candidate["eventType"] == "contract_end"
    assert candidate["wantsWorkplaceChange"] is True
    asked = {question["factKey"] for question in body["questions"]}
    assert "eventType" not in asked
    assert "wantsWorkplaceChange" not in asked
    assert asked == {"occurredAt", "documentsProvided"}


def test_employer_request_is_extracted(client, profile):
    body = analyze(client, profile, "회사에서 갑자기 그만 나오라고 했어요").json()
    assert body["eventCandidate"]["eventType"] == "employer_termination_request"
    assert body["eventCandidate"]["actor"] == "employer"


@pytest.mark.parametrize(("text", "expected"), [
    ("계약이 끝났고 서류를 받았어요", True),
    ("계약이 끝났지만 서류를 받지 못했어요", False),
])
def test_document_status_is_distinguished(client, profile, text, expected):
    assert analyze(client, profile, text).json()["eventCandidate"]["documentsProvided"] is expected


def test_negative_workplace_change_wins_over_positive_fragment(client, profile):
    body = analyze(client, profile, "계약이 끝났지만 회사를 바꾸고 싶지 않아요").json()
    assert body["eventCandidate"]["wantsWorkplaceChange"] is False


@pytest.mark.parametrize(("text", "expected"), [
    ("2026년 8월 20일에 발생했어요", "2026-08-20"),
    ("2026년 08월 20일에 발생했어요", "2026-08-20"),
    ("2026-8-20 발생", "2026-08-20"),
])
def test_deterministic_date_parser_does_not_truncate_day(text, expected):
    parsed = extract_date(text)
    assert parsed is not None
    assert parsed.isoformat() == expected


def test_confirm_requires_user_confirmation(client):
    candidate = {
        "eventType": "contract_end", "occurredAt": "2026-08-20", "actor": "mutual",
        "reasonCode": "contract_end", "wantsWorkplaceChange": True, "documentsProvided": False,
        "confidence": 0.9, "sourceText": "계약이 끝났어요", "missingFacts": [],
    }
    response = client.post("/api/v1/facts/confirm", json={
        "sourceText": "계약이 끝났어요", "eventCandidate": candidate, "answers": {}, "confirmedByUser": False,
    })
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "user_confirmation_required"


def test_confirm_merges_only_missing_answers(client):
    candidate = {
        "eventType": "contract_end", "occurredAt": None, "actor": "mutual",
        "reasonCode": "contract_end", "wantsWorkplaceChange": True, "documentsProvided": None,
        "confidence": 0.9, "sourceText": "계약이 끝났는데 다른 회사로 옮기고 싶어요",
        "missingFacts": ["occurredAt", "documentsProvided"],
    }
    response = client.post("/api/v1/facts/confirm", json={
        "sourceText": candidate["sourceText"], "eventCandidate": candidate,
        "answers": {"occurredAt": "2026-08-20", "documentsProvided": False, "wantsWorkplaceChange": False},
        "confirmedByUser": True,
    })
    assert response.status_code == 200
    facts = response.json()["confirmedFacts"]
    assert facts["wantsWorkplaceChange"] is True
    assert facts["documentsProvided"] is False
    assert facts["confirmationStatus"] == "user_confirmed"
