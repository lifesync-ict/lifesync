from app.schemas.common import ApiMeta, VerificationStatus
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
        institutions = [InstitutionCandidate(**item) for item in load_demo_json("demo_institutions.json")]
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
