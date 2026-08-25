from enum import StrEnum
from typing import Literal

from app.schemas.common import ApiMeta, ApiModel, DemoProfile, VerificationStatus
from app.schemas.facts import ConfirmedFacts


class ResponsibleParty(StrEnum):
    WORKER = "worker"
    EMPLOYER = "employer"
    INSTITUTION = "institution"


class RequiredDocument(ApiModel):
    id: str
    name_key: str
    issuer_key: str | None = None
    required: bool
    note_key: str


class ObligationItem(ApiModel):
    id: str
    party: ResponsibleParty
    title_key: str
    description_key: str
    deadline: None = None
    deadline_label_key: str = "official_deadline_check_required"
    days_remaining: None = None
    urgency: Literal["unknown"] = "unknown"
    required_documents: list[RequiredDocument]
    evidence_id: str
    status: Literal["pending"] = "pending"


class RuleEvidence(ApiModel):
    id: str
    rule_name_key: str
    issuing_agency_key: str
    source_title_key: str
    source_url: str | None = None
    effective_from: None = None
    checked_at: None = None
    verification_status: VerificationStatus = VerificationStatus.REVIEW_REQUIRED
    applicability_note_key: str


class EvaluateActionsRequest(ApiModel):
    confirmed_facts: ConfirmedFacts
    profile: DemoProfile


class EvaluateActionsResponse(ApiModel):
    status: Literal["complete", "review_required"]
    scenario_summary_key: str
    obligations: list[ObligationItem]
    evidence: list[RuleEvidence]
    warnings: list[str]
    meta: ApiMeta
