import json
from functools import lru_cache
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


class DemoDataError(RuntimeError):
    pass


@lru_cache
def load_demo_json(filename: str) -> list[dict[str, Any]]:
    try:
        value = json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DemoDataError(f"Unable to load required demo data: {filename}") from exc
    if not isinstance(value, list):
        raise DemoDataError(f"Demo data must be a list: {filename}")
    return value


def demo_data_ready() -> bool:
    from app.official_guidance.repository import load_official_guidance, load_official_institutions

    load_demo_json("demo_rules.json")
    load_demo_json("demo_institutions.json")
    load_official_guidance()
    load_official_institutions()
    return True
