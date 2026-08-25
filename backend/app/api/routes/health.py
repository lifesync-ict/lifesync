from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.schemas.common import HealthResponse
from app.services.data_loader import DemoDataError, demo_data_ready


router = APIRouter(tags=["health"])


def health_response() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.app_name, version=settings.app_version)


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return health_response()


@router.get("/ready", response_model=HealthResponse)
async def ready() -> HealthResponse:
    try:
        demo_data_ready()
    except DemoDataError as exc:
        raise HTTPException(status_code=503, detail="필수 시연 데이터를 불러올 수 없습니다.") from exc
    return health_response()
