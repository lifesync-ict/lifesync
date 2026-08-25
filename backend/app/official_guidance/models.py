from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, HttpUrl


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class GuidanceModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class OfficialVerificationStatus(StrEnum):
    REVIEW_REQUIRED = "review_required"
    VERIFIED = "verified"
    EXPIRED = "expired"
    SUPERSEDED = "superseded"


class DeadlineRule(GuidanceModel):
    anchor_fact: str
    calendar_months: int | None = None
    calendar_days: int | None = None
    label_key: str


class OfficialGuidance(GuidanceModel):
    id: str
    title: str
    issuing_authority: str
    source_url: HttpUrl | None = None
    source_type: str
    effective_from: date | None = None
    effective_to: date | None = None
    retrieved_at: date
    last_verified_at: date | None = None
    verification_status: OfficialVerificationStatus
    applicable_conditions: list[str]
    deadline_rule: DeadlineRule | None = None
    required_documents: list[str]
    institution_ids: list[str]
    notes: list[str]


class OfficialInstitution(GuidanceModel):
    id: str
    official_name: str | None = None
    institution_type: str
    jurisdiction: str | None = None
    supported_tasks: list[str]
    address: str | None = None
    phone: str | None = None
    official_url: HttpUrl | None = None
    source_url: HttpUrl | None = None
    last_verified_at: date | None = None
    verification_status: OfficialVerificationStatus
