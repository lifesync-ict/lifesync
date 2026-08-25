from typing import Protocol

from app.schemas.common import DemoProfile
from app.schemas.facts import EventCandidate, LanguageCode


class FactAnalysisProvider(Protocol):
    async def analyze(self, text: str, language: LanguageCode, profile: DemoProfile) -> EventCandidate:
        """Extract possible facts without confirming an administrative or legal conclusion."""
        ...


class FactAnalysisProviderError(RuntimeError):
    """Sanitized provider failure safe to convert into an API warning code."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(code)
