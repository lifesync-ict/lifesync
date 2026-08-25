import re
from datetime import date

from app.schemas.common import DemoProfile
from app.schemas.facts import Actor, EventCandidate, EventType, LanguageCode


PHRASES = {
    "employer_request": [
        "그만두라고 했어요", "나가라고 했어요", "해고했어요", "잘렸어요", "퇴사하라고 했어요", "그만 나오라고 했어요",
        "told me to quit", "told me not to come back", "asked me to leave", "yêu cầu tôi nghỉ việc",
        "काममा नआउन", "काम छोड्न",
    ],
    "contract_end": [
        "계약이 끝났어요", "계약이 끝났는데", "계약기간이 만료되었어요", "계약 만료", "계약 종료",
        "contract ended", "contract expired", "hợp đồng đã hết", "hết hạn hợp đồng", "सम्झौता सकियो",
    ],
    "documents_missing": [
        "서류를 못 받았어요", "서류를 받지 못했어요", "서류를 안 주었어요", "서류를 주지 않아요",
        "did not receive the documents", "won't give me the documents", "không đưa giấy tờ", "कागजात दिएन",
    ],
    "documents_provided": [
        "서류를 받았어요", "서류를 주었어요", "서류를 제공받았어요", "received the documents",
        "đã nhận giấy tờ", "कागजात पाएँ",
    ],
    "change_negative": [
        "옮기고 싶지 않아요", "사업장을 변경하지 않을 거예요", "회사를 바꾸고 싶지 않아요", "지금 회사에 계속 있고 싶어요",
        "do not want to move", "don't want to move", "không muốn chuyển", "परिवर्तन गर्न चाहन्न",
    ],
    "change_positive": [
        "다른 회사로 옮기고 싶어요", "사업장을 변경하고 싶어요", "회사를 바꾸고 싶어요", "다른 곳에서 일하고 싶어요",
        "want to move to another company", "chuyển sang công ty khác", "अर्को कम्पनीमा जान चाहन्छु",
    ],
}


def contains(text: str, group: str) -> bool:
    lowered = text.casefold()
    return any(phrase.casefold() in lowered for phrase in PHRASES[group])


def extract_date(text: str) -> date | None:
    match = re.search(
        r"(?<!\d)(20\d{2})\s*(?:년|[./-])\s*(1[0-2]|0?[1-9])"
        r"\s*(?:월|[./-])\s*(3[01]|[12]\d|0?[1-9])\s*(?:일)?(?!\d)",
        text,
    )
    if not match:
        return None
    try:
        return date(*(int(value) for value in match.groups()))
    except ValueError:
        return None


class DeterministicFactAnalysisProvider:
    async def analyze(self, text: str, language: LanguageCode, profile: DemoProfile) -> EventCandidate:
        del language, profile
        employer_request = contains(text, "employer_request")
        contract_end = contains(text, "contract_end")
        documents_missing = contains(text, "documents_missing")
        documents_provided = contains(text, "documents_provided") and not documents_missing
        rejects_change = contains(text, "change_negative")
        wants_change = contains(text, "change_positive")

        event_type = EventType.EMPLOYER_TERMINATION_REQUEST if employer_request else EventType.CONTRACT_END if contract_end else EventType.UNKNOWN
        actor = Actor.EMPLOYER if employer_request else Actor.MUTUAL if contract_end else None
        candidate = EventCandidate(
            event_type=event_type,
            occurred_at=extract_date(text),
            actor=actor,
            reason_code="employer_request" if employer_request else "contract_end" if contract_end else None,
            wants_workplace_change=False if rejects_change else True if wants_change else None,
            documents_provided=False if documents_missing else True if documents_provided else None,
            confidence=0.86 if event_type != EventType.UNKNOWN else 0.25,
            source_text=text,
            missing_facts=[],
        )
        required = ["eventType", "occurredAt", "actor", "wantsWorkplaceChange", "documentsProvided"]
        values = [candidate.event_type if candidate.event_type != EventType.UNKNOWN else None, candidate.occurred_at, candidate.actor, candidate.wants_workplace_change, candidate.documents_provided]
        candidate.missing_facts = [key for key, value in zip(required, values, strict=True) if value is None]
        return candidate
