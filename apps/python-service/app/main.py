"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health

app = FastAPI(
    title="Python Service",
    description="Python microservice with LangChain/LangGraph",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "python-service",
        "version": "0.1.0",
        "environment": settings.environment,
    }
