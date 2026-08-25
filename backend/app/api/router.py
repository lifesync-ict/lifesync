from fastapi import APIRouter

from app.api.routes import actions, facts, handoff, health


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(facts.router)
api_router.include_router(actions.router)
api_router.include_router(handoff.router)
