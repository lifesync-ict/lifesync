from datetime import date

import pytest

from app.official_guidance.repository import load_official_guidance, load_official_institutions
from app.official_guidance.deadlines import calculate_verified_deadline
from app.official_guidance.models import DeadlineRule
from app.official_guidance.validator import (
    OfficialDataValidationError, validate_guidance_data, validate_institution_data,
)


def guidance(**overrides):
    value = {
        "id": "source-1", "title": "Official source", "issuingAuthority": "Authority",
        "sourceUrl": "https://www.law.go.kr/example", "sourceType": "statute",
        "effectiveFrom": "2025-01-01", "effectiveTo": None, "retrievedAt": "2026-08-25",
        "lastVerifiedAt": "2026-08-25", "verificationStatus": "verified",
        "applicableConditions": ["E-9"], "deadlineRule": None, "requiredDocuments": [],
        "institutionIds": [], "notes": [],
    }
    value.update(overrides)
    return value


def test_repository_loads_only_validated_official_data():
    assert all(item.source_url for item in load_official_guidance() if item.verification_status == "verified")
    assert all(item.verification_status == "review_required" for item in load_official_institutions())


def test_non_official_domain_is_blocked():
    with pytest.raises(OfficialDataValidationError):
        validate_guidance_data([guidance(sourceUrl="https://example.com/post")])


def test_deadline_without_verified_source_is_blocked():
    with pytest.raises(OfficialDataValidationError):
        validate_guidance_data([guidance(
            sourceUrl=None, verificationStatus="review_required", lastVerifiedAt=None,
            deadlineRule={"anchorFact": "occurred_at", "calendarDays": 7, "labelKey": "deadline"},
        )])


def test_expired_source_cannot_remain_verified():
    with pytest.raises(OfficialDataValidationError):
        validate_guidance_data([guidance(effectiveTo="2026-01-01")], today=date(2026, 8, 25))


def test_unverified_institution_cannot_expose_contact_details():
    with pytest.raises(OfficialDataValidationError):
        validate_institution_data([{
            "id": "office", "officialName": "Unverified office", "institutionType": "employment_center",
            "jurisdiction": None, "supportedTasks": [], "address": None, "phone": "000-0000",
            "officialUrl": None, "sourceUrl": None, "lastVerifiedAt": None,
            "verificationStatus": "review_required",
        }])


def test_duplicate_ids_are_blocked():
    with pytest.raises(OfficialDataValidationError):
        validate_guidance_data([guidance(), guidance()])


def test_verified_deadline_uses_its_explicit_anchor_only():
    rule = DeadlineRule(anchorFact="employment_contract_ended_at", calendarMonths=1, labelKey="deadline")
    assert calculate_verified_deadline(rule, {"occurred_at": date(2026, 8, 20)}) is None
    result = calculate_verified_deadline(
        rule, {"employment_contract_ended_at": date(2026, 8, 20)}, today=date(2026, 8, 25),
    )
    assert result is not None
    assert result.deadline == date(2026, 9, 20)
    assert result.days_remaining == 26
