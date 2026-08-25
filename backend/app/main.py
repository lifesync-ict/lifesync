from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import api_router
from app.api.routes.health import health_response
from app.core.config import Settings, get_settings
from app.core.errors import ApiError


def error_body(code: str, message: str, request_id: str, details: list[object]) -> dict[str, object]:
    return {"error": {"code": code, "message": message, "requestId": request_id, "details": details}}


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message, request_id, exc.details))


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    details = [{"location": list(error["loc"]), "message": error["msg"], "type": error["type"]} for error in exc.errors()]
    return JSONResponse(status_code=422, content=error_body("validation_error", "입력 내용을 확인해 주세요.", request_id, details))


async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    message = exc.detail if isinstance(exc.detail, str) else "요청을 처리할 수 없습니다."
    return JSONResponse(status_code=exc.status_code, content=error_body("http_error", message, request_id, []))


async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    del exc
    request_id = request.headers.get("x-request-id") or str(uuid4())
    return JSONResponse(status_code=500, content=error_body("internal_error", "요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.", request_id, []))


def create_app(settings: Settings | None = None) -> FastAPI:
    selected = settings or get_settings()
    application = FastAPI(title="LifeSync Backend", version=selected.app_version)
    application.state.settings = selected
    application.add_middleware(
        CORSMiddleware,
        allow_origins=selected.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(ApiError, api_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.add_exception_handler(StarletteHTTPException, http_error_handler)
    application.add_exception_handler(Exception, unexpected_error_handler)

    @application.get("/health", tags=["health"])
    async def root_health(request: Request):
        return health_response(request.app.state.settings)

    application.include_router(api_router, prefix=selected.api_prefix)
    return application


app = create_app()
