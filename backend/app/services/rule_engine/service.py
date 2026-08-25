from app.schemas.actions import (
    EvaluateActionsRequest, EvaluateActionsResponse, ObligationItem, RequiredDocument, RuleEvidence,
)
from app.schemas.common import ApiMeta, VerificationStatus
from app.schemas.facts import EventType
from app.official_guidance.models import OfficialVerificationStatus
from app.official_guidance.deadlines import calculate_verified_deadline
from app.official_guidance.repository import safe_official_guidance
from app.services.data_loader import load_demo_json


SUPPORTED_EVENTS = {EventType.CONTRACT_END, EventType.EMPLOYER_TERMINATION_REQUEST}
OFFICIAL_SOURCE_BY_DEMO_EVIDENCE = {
    "evidence-employment-review": "foreign-workers-act-article-25",
    "evidence-immigration-review": "foreign-workers-enforcement-rule-article-16",
}


class RuleEngineService:
    async def evaluate(self, request: EvaluateActionsRequest) -> EvaluateActionsResponse:
        facts, profile = request.confirmed_facts, request.profile
        supported = (
            profile.visa_type.upper() == "E-9"
            and "제조" in profile.industry
            and "음성" in profile.region
            and facts.event_type in SUPPORTED_EVENTS
            and facts.wants_workplace_change is True
        )
        if not supported:
            return EvaluateActionsResponse(
                status="review_required", scenario_summary_key="unsupported_demo_scenario",
                obligations=[], evidence=[], warnings=["expert_review_required"], meta=ApiMeta(),
            )

        rules = load_demo_json("demo_rules.json")
        official_sources = {item.id: item for item in safe_official_guidance()}
        obligations = []
        evidence = []
        for rule in rules:
            documents = []
            if rule["documentStatus"] == "review_required":
                documents.append(RequiredDocument(
                    id=f'{rule["id"]}-document-review', name_key="document_check_required",
                    required=False, note_key="document_requirements_unverified",
                ))
            source = official_sources.get(OFFICIAL_SOURCE_BY_DEMO_EVIDENCE.get(rule["evidenceId"], ""))
            verified = source is not None and source.verification_status is OfficialVerificationStatus.VERIFIED
            calculated = calculate_verified_deadline(source.deadline_rule if verified and source else None, {
                "occurred_at": facts.occurred_at,
            })
            obligations.append(ObligationItem(
                id=rule["id"], party=rule["party"], title_key=rule["titleKey"],
                description_key=rule["descriptionKey"], required_documents=documents,
                evidence_id=rule["evidenceId"],
                deadline=calculated.deadline.isoformat() if calculated else None,
                deadline_label_key=source.deadline_rule.label_key if calculated and source and source.deadline_rule else "official_deadline_check_required",
                days_remaining=calculated.days_remaining if calculated else None,
                urgency=calculated.urgency if calculated else "unknown",
            ))
            evidence.append(RuleEvidence(
                id=rule["evidenceId"],
                rule_name_key=source.title if verified else rule["ruleNameKey"],
                issuing_agency_key=source.issuing_authority if verified else rule["issuingAgencyKey"],
                source_title_key=source.title if verified else rule["sourceTitleKey"],
                source_url=str(source.source_url) if verified and source.source_url else None,
                effective_from=source.effective_from.isoformat() if verified and source.effective_from else None,
                checked_at=source.last_verified_at.isoformat() if verified and source.last_verified_at else None,
                verification_status=VerificationStatus.VERIFIED if verified else VerificationStatus.REVIEW_REQUIRED,
                applicability_note_key="official_scope_requires_case_confirmation" if verified else rule["applicabilityNoteKey"],
            ))
        return EvaluateActionsResponse(
            status="complete", scenario_summary_key="supported_e9_manufacturing_demo",
            obligations=obligations, evidence=evidence,
            warnings=["official_sources_do_not_determine_individual_eligibility"],
            meta=ApiMeta(verification_status=VerificationStatus.REVIEW_REQUIRED),
        )


rule_engine_service = RuleEngineService()
