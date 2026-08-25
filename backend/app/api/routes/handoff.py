from fastapi import APIRouter

from app.schemas.handoff import PrepareHandoffRequest, PrepareHandoffResponse
from app.services.handoff.service import handoff_service


router = APIRouter(prefix="/handoff", tags=["handoff"])


@router.post("/prepare", response_model=PrepareHandoffResponse)
async def prepare_handoff(request: PrepareHandoffRequest) -> PrepareHandoffResponse:
    return await handoff_service.prepare(request)
