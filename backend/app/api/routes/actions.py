from fastapi import APIRouter

from app.schemas.actions import EvaluateActionsRequest, EvaluateActionsResponse
from app.services.rule_engine.service import rule_engine_service


router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("/evaluate", response_model=EvaluateActionsResponse)
async def evaluate_actions(request: EvaluateActionsRequest) -> EvaluateActionsResponse:
    return await rule_engine_service.evaluate(request)
