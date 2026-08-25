from collections.abc import Iterable
from datetime import date
from urllib.parse import urlparse

from pydantic import ValidationError

from app.official_guidance.models import OfficialGuidance, OfficialInstitution, OfficialVerificationStatus


ALLOWED_OFFICIAL_DOMAINS = {
    "law.go.kr", "www.law.go.kr", "moel.go.kr", "www.moel.go.kr", "1350.moel.go.kr",
    "eps.go.kr", "www.eps.go.kr", "hikorea.go.kr", "www.hikorea.go.kr",
    "immigration.go.kr", "www.immigration.go.kr", "moj.go.kr", "www.moj.go.kr",
    "chungbuk.go.kr", "www.chungbuk.go.kr", "eumseong.go.kr", "www.eumseong.go.kr",
}


class OfficialDataValidationError(ValueError):
    pass


def _validate_url(value: object, field: str, item_id: str) -> None:
    if value is None:
        return
    parsed = urlparse(str(value))
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_OFFICIAL_DOMAINS:
        raise OfficialDataValidationError(f"{item_id}: invalid official {field}")


def _unique(items: Iterable[OfficialGuidance | OfficialInstitution]) -> None:
    seen: set[str] = set()
    for item in items:
        if item.id in seen:
            raise OfficialDataValidationError(f"duplicate official data id: {item.id}")
        seen.add(item.id)


def validate_guidance_data(raw: list[dict], *, today: date | None = None) -> list[OfficialGuidance]:
    try:
        items = [OfficialGuidance.model_validate(item) for item in raw]
    except ValidationError as exc:
        raise OfficialDataValidationError("invalid official guidance data") from exc
    _unique(items)
    current = today or date.today()
    for item in items:
        _validate_url(item.source_url, "source URL", item.id)
        if item.verification_status is OfficialVerificationStatus.VERIFIED:
            if item.source_url is None or item.last_verified_at is None:
                raise OfficialDataValidationError(f"{item.id}: verified source metadata is incomplete")
            if item.effective_to and item.effective_to < current:
                raise OfficialDataValidationError(f"{item.id}: expired source cannot be verified")
        if item.deadline_rule and (
            item.source_url is None or item.verification_status is not OfficialVerificationStatus.VERIFIED
        ):
            raise OfficialDataValidationError(f"{item.id}: deadline rule lacks a verified source")
    return items


def validate_institution_data(raw: list[dict]) -> list[OfficialInstitution]:
    try:
        items = [OfficialInstitution.model_validate(item) for item in raw]
    except ValidationError as exc:
        raise OfficialDataValidationError("invalid official institution data") from exc
    _unique(items)
    for item in items:
        _validate_url(item.official_url, "official URL", item.id)
        _validate_url(item.source_url, "source URL", item.id)
        if item.verification_status is OfficialVerificationStatus.VERIFIED and (
            item.official_name is None or item.source_url is None or item.last_verified_at is None
        ):
            raise OfficialDataValidationError(f"{item.id}: verified institution metadata is incomplete")
        if item.verification_status is not OfficialVerificationStatus.VERIFIED and any(
            (item.official_name, item.jurisdiction, item.address, item.phone, item.official_url)
        ):
            raise OfficialDataValidationError(f"{item.id}: unverified institution exposes details")
    return items
