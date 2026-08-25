from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class VerificationStatus(StrEnum):
    VERIFIED = "verified"
    REVIEW_REQUIRED = "review_required"
    UNAVAILABLE = "unavailable"


class ApiMeta(ApiModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    schema_version: str = "1.0"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    demo_only: bool = True
    verification_status: VerificationStatus = VerificationStatus.REVIEW_REQUIRED


class DemoProfile(ApiModel):
    visa_type: str
    nationality: str
    region: str
    industry: str


class HealthResponse(ApiModel):
    status: str
    service: str
    version: str
