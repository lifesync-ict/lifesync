import calendar
from dataclasses import dataclass
from datetime import date, timedelta

from app.official_guidance.models import DeadlineRule


@dataclass(frozen=True)
class CalculatedDeadline:
    deadline: date
    days_remaining: int
    urgency: str


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def calculate_verified_deadline(
    rule: DeadlineRule | None, anchors: dict[str, date | None], *, today: date | None = None,
) -> CalculatedDeadline | None:
    if rule is None or anchors.get(rule.anchor_fact) is None:
        return None
    deadline = anchors[rule.anchor_fact]
    assert deadline is not None
    if rule.calendar_months is not None:
        deadline = _add_months(deadline, rule.calendar_months)
    if rule.calendar_days is not None:
        deadline += timedelta(days=rule.calendar_days)
    remaining = (deadline - (today or date.today())).days
    urgency = "overdue" if remaining < 0 else "today" if remaining == 0 else "urgent" if remaining <= 7 else "normal"
    return CalculatedDeadline(deadline=deadline, days_remaining=remaining, urgency=urgency)
