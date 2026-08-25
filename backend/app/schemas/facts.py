from datetime import date
from enum import StrEnum
from typing import Any, Literal

from pydantic import Field, field_validator

from app.schemas.common import ApiMeta, ApiModel, DemoProfile


class LanguageCode(StrEnum):
    KO = "ko"
    EN = "en"
    VI = "vi"
    NE = "ne"


class EventType(StrEnum):
    CONTRACT_END = "contract_end"
    EMPLOYER_TERMINATION_REQUEST = "employer_termination_request"
    UNKNOWN = "unknown"


class Actor(StrEnum):
    EMPLOYER = "employer"
    MUTUAL = "mutual"
    UNKNOWN = "unknown"


class EventCandidate(ApiModel):
    event_type: EventType = EventType.UNKNOWN
    occurred_at: date | None = None
    actor: Actor | None = None
    reason_code: str | None = None
    wants_workplace_change: bool | None = None
    documents_provided: bool | None = None
    confidence: float = Field(ge=0, le=1)
    source_text: str
    missing_facts: list[str]


class ClarificationQuestion(ApiModel):
    id: str
    fact_key: str
    prompt_key: str
    option_keys: list[str] = Field(default_factory=list)
    reason_key: str
    required: bool = True
    input_type: Literal["single_choice", "date"]


class AnalyzeFactsRequest(ApiModel):
    text: str = Field(min_length=1, max_length=1000)
    language: LanguageCode
    profile: DemoProfile

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("상황 문장을 입력해 주세요.")
        return normalized


class AnalyzeFactsResponse(ApiModel):
    status: Literal["needs_input", "ready_to_confirm", "review_required"]
    event_candidate: EventCandidate
    questions: list[ClarificationQuestion]
    warnings: list[str]
    meta: ApiMeta


class ConfirmFactsRequest(ApiModel):
    source_text: str = Field(min_length=1, max_length=1000)
    event_candidate: EventCandidate
    answers: dict[str, Any]
    confirmed_by_user: bool

    @field_validator("source_text")
    @classmethod
    def normalize_source_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("상황 문장을 입력해 주세요.")
        return normalized


class ConfirmedFacts(ApiModel):
    event_type: EventType
    occurred_at: date
    actor: Actor
    reason_code: str | None
    wants_workplace_change: bool
    documents_provided: bool
    source_text: str
    confirmation_status: Literal["user_confirmed"] = "user_confirmed"


class ConfirmFactsResponse(ApiModel):
    status: Literal["confirmed"] = "confirmed"
    confirmed_facts: ConfirmedFacts
    meta: ApiMeta
