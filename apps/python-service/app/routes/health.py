"""Health check routes."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "python-service",
        },
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    # Add database connectivity check here
    return {
        "success": True,
        "data": {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
        },
    }
