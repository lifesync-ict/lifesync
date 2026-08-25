from app.schemas.actions import (
    EvaluateActionsRequest, EvaluateActionsResponse, ObligationItem, RequiredDocument, RuleEvidence,
)
from app.schemas.common import ApiMeta, VerificationStatus
from app.schemas.facts import EventType
from app.services.data_loader import load_demo_json


SUPPORTED_EVENTS = {EventType.CONTRACT_END, EventType.EMPLOYER_TERMINATION_REQUEST}


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
        obligations = []
        evidence = []
        for rule in rules:
            documents = []
            if rule["documentStatus"] == "review_required":
                documents.append(RequiredDocument(
                    id=f'{rule["id"]}-document-review', name_key="document_check_required",
                    required=False, note_key="document_requirements_unverified",
                ))
            obligations.append(ObligationItem(
                id=rule["id"], party=rule["party"], title_key=rule["titleKey"],
                description_key=rule["descriptionKey"], required_documents=documents,
                evidence_id=rule["evidenceId"],
            ))
            evidence.append(RuleEvidence(
                id=rule["evidenceId"], rule_name_key=rule["ruleNameKey"],
                issuing_agency_key=rule["issuingAgencyKey"], source_title_key=rule["sourceTitleKey"],
                applicability_note_key=rule["applicabilityNoteKey"],
            ))
        return EvaluateActionsResponse(
            status="complete", scenario_summary_key="supported_e9_manufacturing_demo",
            obligations=obligations, evidence=evidence,
            warnings=["demo_rules_require_official_verification"],
            meta=ApiMeta(verification_status=VerificationStatus.REVIEW_REQUIRED),
        )


rule_engine_service = RuleEngineService()
