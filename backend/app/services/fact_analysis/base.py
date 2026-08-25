from typing import Protocol

from app.schemas.common import DemoProfile
from app.schemas.facts import EventCandidate, LanguageCode


class FactAnalysisProvider(Protocol):
    async def analyze(self, text: str, language: LanguageCode, profile: DemoProfile) -> EventCandidate:
        """Extract possible facts without confirming an administrative or legal conclusion."""
        ...
