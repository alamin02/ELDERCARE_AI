import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.models import *  # Ensure all models are registered
from backend.app.routes.auth import router as auth_router
from backend.app.routes.elderly import router as elderly_router
from backend.app.routes.medications import router as medications_router
from backend.app.routes.prescriptions import router as prescriptions_router
from backend.app.routes.assistant import router as assistant_router
from backend.app.routes.caregiver import router as caregiver_router
from backend.app.routes.health import router as health_router
from backend.app.routes.emergency import router as emergency_router
from backend.app.routes.settings import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Care. Safe Medication. Better Aging. — AI-powered elderly care platform.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint for Google Cloud Run
@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health Check"])
def health_check():
    """Health check endpoint for Google Cloud Run probes."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }


# Include Modular Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(elderly_router, prefix=settings.API_V1_PREFIX)
app.include_router(medications_router, prefix=settings.API_V1_PREFIX)
app.include_router(prescriptions_router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant_router, prefix=settings.API_V1_PREFIX)
app.include_router(caregiver_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(emergency_router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router, prefix=settings.API_V1_PREFIX)

# Static files for production Single Service deployment (Cloud Run)
static_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(static_dist_path):
    assets_dir = os.path.join(static_dist_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Do not catch API paths or OpenAPI documentation
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(static_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Frontend file not found")
else:
    @app.get("/", include_in_schema=False)
    def api_root():
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "message": "ElderCare AI API is running. Build frontend with 'npm run build' to enable SPA interface.",
            "documentation": "/docs",
            "health": "/api/health"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
