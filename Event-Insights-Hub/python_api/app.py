from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field


APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent.parent

MODEL_PATH = Path(os.getenv("MODEL_PATH", REPO_ROOT / "artifacts" / "latest_model.joblib"))


class Frictions(BaseModel):
    relevance: int = Field(ge=1, le=5)
    schedule: int = Field(ge=1, le=5)
    fatigue: int = Field(ge=1, le=5)
    promotion: int = Field(ge=1, le=5)
    social: int = Field(ge=1, le=5)
    format: int = Field(ge=1, le=5)


class PredictionRequest(BaseModel):
    domain: str
    eventType: str
    speakerType: str
    durationHours: float
    dayType: str
    timeSlot: str
    promotionDays: int
    certificateFlag: bool
    interactivityLevel: float
    frictions: Frictions


class PredictionResponse(BaseModel):
    predictedAttendance: int


app = FastAPI(title="CampusIntel Model API")


def _expand_friction_one_hot(frictions: Frictions) -> Dict[str, int]:
    # Training dataset uses one-hot columns like Relevance_Friction_1..5 etc.
    mapping = {
        "Relevance_Friction": frictions.relevance,
        "Schedule_Friction": frictions.schedule,
        "Fatigue_Friction": frictions.fatigue,
        "Promotion_Friction": frictions.promotion,
        "Social_Friction": frictions.social,
        "Format_Friction": frictions.format,
    }

    expanded: Dict[str, int] = {}
    for prefix, rating in mapping.items():
        for level in range(1, 6):
            expanded[f"{prefix}_{level}"] = 1 if rating == level else 0

    return expanded


def _to_model_input(req: PredictionRequest) -> pd.DataFrame:
    row: Dict[str, Any] = {
        "Domain": req.domain,
        "Event_Type": req.eventType,
        "Speaker_Type": req.speakerType,
        "Duration_Hours": float(req.durationHours),
        "Day_Type": req.dayType,
        "Time_Slot": req.timeSlot,
        "Promotion_Days": int(req.promotionDays),
        "Certificate_Flag": 1 if req.certificateFlag else 0,
        "Interactivity_Level": float(req.interactivityLevel),
    }

    row.update(_expand_friction_one_hot(req.frictions))
    return pd.DataFrame([row])


@app.on_event("startup")
def _load_model() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    app.state.model = joblib.load(MODEL_PATH)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "modelPath": str(MODEL_PATH),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest) -> PredictionResponse:
    model = app.state.model
    df = _to_model_input(req)
    pred = model.predict(df)[0]
    return PredictionResponse(predictedAttendance=int(round(float(pred))))
