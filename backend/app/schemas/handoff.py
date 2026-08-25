from enum import StrEnum
from typing import Literal

from app.schemas.actions import EvaluateActionsResponse
from pydantic import Field

from app.schemas.common import ApiMeta, ApiModel, DemoProfile, VerificationStatus
from app.schemas.facts import ConfirmedFacts


class InstitutionType(StrEnum):
    EMPLOYMENT_CENTER = "employment_center"
    IMMIGRATION_OFFICE = "immigration_office"
    WORKER_SUPPORT_CENTER = "worker_support_center"


class InstitutionCandidate(ApiModel):
    id: str
    type: InstitutionType
    name: str | None = None
    role_key: str
    reason_key: str
    jurisdiction: str | None = None
    address: str | None = None
    phone: str | None = None
    source_url: str | None = None
    verification_status: VerificationStatus = VerificationStatus.REVIEW_REQUIRED
    caution_key: str = "exact_institution_check_required"


class EvidenceBundleItem(ApiModel):
    id: str
    category: str
    title_key: str
    description_key: str
    included: bool
    required: bool
    source: str


class PrepareHandoffRequest(ApiModel):
    confirmed_facts: ConfirmedFacts
    profile: DemoProfile
    action_guidance: EvaluateActionsResponse
    completed_action_ids: list[str] = Field(default_factory=list)
    selected_evidence_item_ids: list[str] = Field(default_factory=list)


class PrepareHandoffResponse(ApiModel):
    status: Literal["ready", "needs_review"]
    primary_institution: InstitutionCandidate | None
    alternative_institutions: list[InstitutionCandidate]
    evidence_bundle: list[EvidenceBundleItem]
    questions_to_ask: list[str]
    privacy_notice_key: str
    warnings: list[str]
    meta: ApiMeta
