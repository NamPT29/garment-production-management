from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Garment AI Service",
    description="Baseline AI service cho he thong quan ly san xuat xuong may",
    version="0.1.0",
)


class BaselineRequest(BaseModel):
    payload: dict[str, Any] = Field(default_factory=dict)


class BaselineResponse(BaseModel):
    success: bool
    data: dict[str, Any]
    message: str


def baseline_response(feature: str, result: dict[str, Any]) -> BaselineResponse:
    return BaselineResponse(
        success=True,
        data={
            "feature": feature,
            "modelType": "baseline",
            "modelVersion": "phase-1-placeholder",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "result": result,
        },
        message="Ket qua baseline minh hoa, chua phai mo hinh da huan luyen",
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "success": True,
        "data": {
            "service": "ai-service",
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "message": "AI Service dang hoat dong",
    }


@app.post("/ai/production-plan", response_model=BaselineResponse)
def suggest_production_plan(_: BaselineRequest) -> BaselineResponse:
    return baseline_response(
        "production-plan",
        {
            "suggestedLineId": None,
            "score": 0,
            "warnings": ["Can du lieu don hang, chuyen may, nhan su, thiet bi va vat tu"],
            "reasons": ["Endpoint duoc khoi tao trong Phase 1 de san sang tich hop"],
        },
    )


@app.post("/ai/delivery-risk", response_model=BaselineResponse)
def predict_delivery_risk(_: BaselineRequest) -> BaselineResponse:
    return baseline_response(
        "delivery-risk",
        {
            "onTimeProbability": 0,
            "riskLevel": "unknown",
            "mainReasons": ["Chua co du lieu tien do va nang suat"],
            "recommendations": ["Bo sung du lieu san xuat o cac phase tiep theo"],
        },
    )


@app.post("/ai/bottleneck", response_model=BaselineResponse)
def detect_bottleneck(_: BaselineRequest) -> BaselineResponse:
    return baseline_response(
        "bottleneck",
        {
            "bottleneckOperation": None,
            "severity": "unknown",
            "recommendations": ["Can du lieu san luong tung cong doan"],
        },
    )


@app.post("/ai/productivity", response_model=BaselineResponse)
def analyze_productivity(_: BaselineRequest) -> BaselineResponse:
    return baseline_response(
        "productivity",
        {
            "groups": [],
            "anomalies": [],
            "recommendations": ["Khong su dung ket qua AI de tu dong ky luat nhan vien"],
        },
    )


@app.post("/ai/material-demand", response_model=BaselineResponse)
def forecast_material_demand(_: BaselineRequest) -> BaselineResponse:
    return baseline_response(
        "material-demand",
        {
            "requirements": [],
            "shortages": [],
            "formula": "need = product_quantity * bom_rate; shortage = need + safety_stock - available_stock",
        },
    )
