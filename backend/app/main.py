import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import vendors, portfolio, export, cache
from app.database import engine, Base

# Load environment variables
load_dotenv()

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WindBorne Vendor Dashboard API",
    description="Vendor comparison and analysis platform with Alpha Vantage integration",
    version="1.0.0"
)

# Production CORS configuration
origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8080",  # Alternative local port
]

# Get additional CORS origins from environment
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    additional_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vendors.router, prefix="/api", tags=["vendors"])
app.include_router(portfolio.router, prefix="/api", tags=["portfolio"])
app.include_router(export.router, prefix="/api", tags=["export"])
app.include_router(cache.router, prefix="/api", tags=["cache"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "WindBorne Vendor Dashboard API",
        "status": "running", 
        "docs": "/docs",
        "version": "1.0.0",
        "trackedVendors": ["TEL", "ST", "DD", "CE", "LYB"],
        "endpoints": {
            "vendors": "/api/vendors",
            "portfolio": "/api/portfolio/kpis",
            "export": "/api/export/csv",
            "health": "/api/health",
            "cache": "/api/cache/status"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "WindBorne Vendor Dashboard API is running"}

@app.get("/health")
async def health_check_root():
    """Alternative health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)