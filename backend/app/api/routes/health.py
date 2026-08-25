from fastapi import APIRouter, HTTPException, Request

from app.core.config import Settings
from app.schemas.common import HealthResponse, ReadyResponse
from app.services.data_loader import DemoDataError, demo_data_ready


router = APIRouter(tags=["health"])


def health_response(settings: Settings) -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name, version=settings.app_version)


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    return health_response(request.app.state.settings)


@router.get("/ready", response_model=ReadyResponse)
async def ready(request: Request) -> ReadyResponse:
    settings = request.app.state.settings
    try:
        demo_data_ready()
    except DemoDataError as exc:
        raise HTTPException(status_code=503, detail="필수 시연 데이터를 불러올 수 없습니다.") from exc
    if not settings.ai_provider_configured:
        raise HTTPException(status_code=503, detail="선택한 AI Provider 설정을 확인해 주세요.")
    health = health_response(settings)
    return ReadyResponse(**health.model_dump(), provider=settings.normalized_ai_provider, provider_configured=True)
