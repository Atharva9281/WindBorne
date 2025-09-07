import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.models.vendor import Vendor, Base as VendorBase
from app.models.cache import VendorCache, RiskScore, PortfolioMetric, CacheStats, Base as CacheBase

# Load environment variables
load_dotenv()

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vendor_cache.db")

# Create engine with production settings
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,  # Set to False in production for performance
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600 if "sqlite" not in DATABASE_URL else -1,  # Recycle connections hourly (not for SQLite)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a unified Base that includes all models
Base = VendorBase

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize the database with all tables"""
    # Create all tables from both model files
    VendorBase.metadata.create_all(bind=engine)
    CacheBase.metadata.create_all(bind=engine)
    
    # Initialize WindBorne vendors if they don't exist
    db = SessionLocal()
    try:
        existing_count = db.query(Vendor).count()
        if existing_count == 0:
            windborne_vendors = Vendor.get_windborne_vendors()
            for vendor_data in windborne_vendors:
                vendor = Vendor(
                    symbol=vendor_data["symbol"],
                    name=vendor_data["name"], 
                    vendor_type=vendor_data["type"],
                    industry="Sensors" if "Sensor" in vendor_data["type"] else "Materials"
                )
                db.add(vendor)
            db.commit()
            print(f"Initialized {len(windborne_vendors)} WindBorne vendors in database")
    except Exception as e:
        print(f"Error initializing vendors: {e}")
        db.rollback()
    finally:
        db.close()

# Export models for easy importing
__all__ = ["Vendor", "VendorCache", "RiskScore", "PortfolioMetric", "CacheStats", "get_db", "init_db"]