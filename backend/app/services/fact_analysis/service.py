from datetime import date
from typing import Any

from app.core.errors import ApiError
from app.schemas.common import ApiMeta
from app.schemas.facts import (
    Actor, AnalyzeFactsRequest, AnalyzeFactsResponse, ClarificationQuestion, ConfirmFactsRequest,
    ConfirmFactsResponse, ConfirmedFacts, EventCandidate, EventType,
)
from app.services.fact_analysis.base import FactAnalysisProvider, FactAnalysisProviderError
from app.services.fact_analysis.deterministic import DeterministicFactAnalysisProvider
from app.services.fact_analysis.factory import create_fact_analysis_provider


QUESTION_DEFINITIONS = {
    "eventType": ("fact_event_type", ["event_contract_end", "event_employer_request"], "reason_event_type", "single_choice"),
    "occurredAt": ("fact_occurred_at", [], "reason_occurred_at", "date"),
    "actor": ("fact_actor", ["actor_employer", "actor_mutual"], "reason_actor", "single_choice"),
    "wantsWorkplaceChange": ("fact_wants_workplace_change", ["yes", "no"], "reason_workplace_change", "single_choice"),
    "documentsProvided": ("fact_documents_provided", ["documents_provided", "documents_not_provided"], "reason_documents", "single_choice"),
}


class FactAnalysisService:
    def __init__(self, provider: FactAnalysisProvider | None = None, fallback_provider: FactAnalysisProvider | None = None):
        self.provider = provider or create_fact_analysis_provider()
        self.fallback_provider = fallback_provider or DeterministicFactAnalysisProvider()

    async def analyze(self, request: AnalyzeFactsRequest) -> AnalyzeFactsResponse:
        warnings: list[str] = []
        try:
            candidate = await self.provider.analyze(request.text, request.language, request.profile)
        except FactAnalysisProviderError as exc:
            candidate = await self.fallback_provider.analyze(request.text, request.language, request.profile)
            warnings.append(exc.code)
            warnings.append("deterministic_fallback_used")
        questions = [self._question(key) for key in candidate.missing_facts]
        if candidate.event_type == EventType.UNKNOWN:
            status = "review_required"
            warnings.append("insufficient_event_information")
        else:
            status = "needs_input" if questions else "ready_to_confirm"
        return AnalyzeFactsResponse(status=status, event_candidate=candidate, questions=questions, warnings=warnings, meta=ApiMeta())

    @staticmethod
    def _question(key: str) -> ClarificationQuestion:
        prompt, options, reason, input_type = QUESTION_DEFINITIONS[key]
        return ClarificationQuestion(id=f"clarify-{key}", fact_key=key, prompt_key=prompt, option_keys=options, reason_key=reason, input_type=input_type)

    def confirm(self, request: ConfirmFactsRequest) -> ConfirmFactsResponse:
        if not request.confirmed_by_user:
            raise ApiError(422, "user_confirmation_required", "사용자가 사실을 명시적으로 확인해야 합니다.")
        candidate = request.event_candidate
        answers = request.answers
        if " ".join(candidate.source_text.split()) != request.source_text:
            raise ApiError(422, "source_text_mismatch", "분석한 상황 문장과 확인할 문장이 일치하지 않습니다.")
        unknown_keys = sorted(set(answers) - set(QUESTION_DEFINITIONS))
        if unknown_keys:
            raise ApiError(422, "unsupported_fact_key", "지원하지 않는 사실 항목이 포함되어 있습니다.", unknown_keys)
        values: dict[str, Any] = {
            "eventType": candidate.event_type if candidate.event_type != EventType.UNKNOWN else None,
            "occurredAt": candidate.occurred_at,
            "actor": candidate.actor,
            "wantsWorkplaceChange": candidate.wants_workplace_change,
            "documentsProvided": candidate.documents_provided,
        }
        for key in QUESTION_DEFINITIONS:
            if values[key] is None and key in answers:
                values[key] = answers[key]
        missing = [key for key, value in values.items() if value is None]
        if missing:
            raise ApiError(422, "missing_required_facts", "필수 확인 사실이 누락되었습니다.", missing)
        try:
            facts = ConfirmedFacts(
                event_type=values["eventType"], occurred_at=values["occurredAt"], actor=values["actor"],
                reason_code=candidate.reason_code, wants_workplace_change=values["wantsWorkplaceChange"],
                documents_provided=values["documentsProvided"], source_text=" ".join(request.source_text.split()),
            )
        except (ValueError, TypeError) as exc:
            raise ApiError(422, "invalid_fact_answer", "확인 답변 형식이 올바르지 않습니다.") from exc
        return ConfirmFactsResponse(confirmed_facts=facts, meta=ApiMeta())


fact_analysis_service = FactAnalysisService()
