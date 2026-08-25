import json
from functools import lru_cache
from pathlib import Path

from app.official_guidance.models import OfficialGuidance, OfficialInstitution
from app.official_guidance.validator import validate_guidance_data, validate_institution_data


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _read(filename: str) -> list[dict]:
    value = json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))
    if not isinstance(value, list):
        raise ValueError(f"Official data must be a list: {filename}")
    return value


@lru_cache
def load_official_guidance() -> list[OfficialGuidance]:
    return validate_guidance_data(_read("official_guidance.json"))


@lru_cache
def load_official_institutions() -> list[OfficialInstitution]:
    return validate_institution_data(_read("official_institutions.json"))


def safe_official_guidance() -> list[OfficialGuidance]:
    try:
        return load_official_guidance()
    except (OSError, ValueError, json.JSONDecodeError):
        return []


def safe_official_institutions() -> list[OfficialInstitution]:
    try:
        return load_official_institutions()
    except (OSError, ValueError, json.JSONDecodeError):
        return []
