from app.schemas.common import ApiMeta, VerificationStatus
from app.official_guidance.models import OfficialVerificationStatus
from app.official_guidance.repository import safe_official_institutions
from app.schemas.handoff import (
    EvidenceBundleItem, InstitutionCandidate, PrepareHandoffRequest, PrepareHandoffResponse,
)
from app.services.data_loader import load_demo_json


class HandoffService:
    async def prepare(self, request: PrepareHandoffRequest) -> PrepareHandoffResponse:
        if not request.action_guidance.obligations:
            return PrepareHandoffResponse(
                status="needs_review", primary_institution=None, alternative_institutions=[], evidence_bundle=[],
                questions_to_ask=["question_exact_institution"], privacy_notice_key="no_personal_information_included",
                warnings=["action_guidance_required"], meta=ApiMeta(),
            )
        demo_by_type = {item["type"]: item for item in load_demo_json("demo_institutions.json")}
        institutions = []
        for official in safe_official_institutions():
            fallback = demo_by_type[official.institution_type]
            verified = official.verification_status is OfficialVerificationStatus.VERIFIED
            institutions.append(InstitutionCandidate(
                id=official.id,
                type=official.institution_type,
                name=official.official_name if verified else None,
                role_key=fallback["roleKey"],
                reason_key=fallback["reasonKey"],
                jurisdiction=official.jurisdiction if verified else None,
                address=official.address if verified else None,
                phone=official.phone if verified else None,
                source_url=str(official.official_url) if verified and official.official_url else None,
                verification_status=VerificationStatus.VERIFIED if verified else VerificationStatus.REVIEW_REQUIRED,
                caution_key="official_institution_verified" if verified else "exact_institution_check_required",
            ))
        if not institutions:
            institutions = [InstitutionCandidate(**item) for item in demo_by_type.values()]
        selected = set(request.selected_evidence_item_ids)
        facts = request.confirmed_facts
        bundle = [
            EvidenceBundleItem(id="source-text", category="situation", title_key="original_situation", description_key="user_provided_source_text", included=not selected or "source-text" in selected, required=True, source="user"),
            EvidenceBundleItem(id="confirmed-facts", category="facts", title_key="confirmed_facts", description_key="facts_confirmed_by_user", included=not selected or "confirmed-facts" in selected, required=True, source="user_confirmed"),
            EvidenceBundleItem(id="action-status", category="actions", title_key="action_progress", description_key="completed_and_pending_actions", included=not selected or "action-status" in selected, required=False, source="demo_rule_review"),
        ]
        questions = ["question_workplace_change_reason", "question_visa_procedure", "question_jurisdiction_and_documents"]
        if not facts.documents_provided:
            questions.insert(1, "question_alternative_document_evidence")
        return PrepareHandoffResponse(
            status="needs_review", primary_institution=institutions[0], alternative_institutions=institutions[1:],
            evidence_bundle=bundle, questions_to_ask=questions, privacy_notice_key="no_personal_information_included",
            warnings=["no_submission_or_booking_performed", "institution_details_require_verification"],
            meta=ApiMeta(verification_status=VerificationStatus.REVIEW_REQUIRED),
        )


handoff_service = HandoffService()
