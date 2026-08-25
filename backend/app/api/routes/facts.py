from fastapi import APIRouter

from app.schemas.facts import AnalyzeFactsRequest, AnalyzeFactsResponse, ConfirmFactsRequest, ConfirmFactsResponse
from app.services.fact_analysis.service import fact_analysis_service


router = APIRouter(prefix="/facts", tags=["facts"])


@router.post("/analyze", response_model=AnalyzeFactsResponse)
async def analyze_facts(request: AnalyzeFactsRequest) -> AnalyzeFactsResponse:
    return await fact_analysis_service.analyze(request)


@router.post("/confirm", response_model=ConfirmFactsResponse)
async def confirm_facts(request: ConfirmFactsRequest) -> ConfirmFactsResponse:
    return fact_analysis_service.confirm(request)
