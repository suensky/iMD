from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.files import router as files_router
from .api.ai import router as ai_router

# Environment-driven settings (simple)
UI_ORIGIN = os.getenv("UI_ORIGIN", "http://localhost:5173")

app = FastAPI(title="AI Markdown Editor API")

# CORS: allow only the local UI in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[UI_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}
