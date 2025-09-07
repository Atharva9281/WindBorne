from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List
import logging

from app.database import get_db
from app.services.cache_optimizer import CacheOptimizer

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/cache/status")
async def get_cache_status(db: Session = Depends(get_db)):
    """Get comprehensive cache status and performance metrics"""
    try:
        optimizer = CacheOptimizer()
        status = optimizer.analyze_cache_usage(db)
        
        return {
            "status": "success",
            "cache_metrics": status,
            "recommendations": _generate_cache_recommendations(status)
        }
        
    except Exception as e:
        logger.error(f"Error getting cache status: {e}")
        raise HTTPException(status_code=500, detail=f"Cache status error: {str(e)}")

@router.post("/cache/optimize")
async def optimize_cache(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger cache optimization process"""
    try:
        optimizer = CacheOptimizer()
        
        # Run cache analysis
        status = optimizer.analyze_cache_usage(db)
        
        # If optimization is needed, trigger background processes
        if status.get("optimization_needed", False):
            background_tasks.add_task(_background_optimization, optimizer, db)
            
            return {
                "status": "success",
                "message": "Cache optimization initiated",
                "background_tasks_started": True,
                "cache_metrics": status
            }
        else:
            return {
                "status": "success", 
                "message": "Cache is already optimized",
                "background_tasks_started": False,
                "cache_metrics": status
            }
            
    except Exception as e:
        logger.error(f"Error optimizing cache: {e}")
        raise HTTPException(status_code=500, detail=f"Cache optimization error: {str(e)}")

@router.post("/cache/preload")
async def preload_cache_data(
    symbols: List[str], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Preload comprehensive data for specified vendor symbols"""
    try:
        optimizer = CacheOptimizer()
        
        # Validate symbols
        if not symbols or len(symbols) > 10:
            raise HTTPException(
                status_code=400, 
                detail="Must provide 1-10 symbols for preloading"
            )
        
        # Start preloading in background
        background_tasks.add_task(_background_preload, optimizer, symbols)
        
        return {
            "status": "success",
            "message": f"Preloading initiated for {len(symbols)} vendors",
            "symbols": symbols,
            "estimated_completion_minutes": len(symbols) * 0.5  # Rough estimate
        }
        
    except Exception as e:
        logger.error(f"Error preloading cache data: {e}")
        raise HTTPException(status_code=500, detail=f"Preload error: {str(e)}")

@router.get("/cache/refresh-candidates")
async def get_refresh_candidates(db: Session = Depends(get_db)):
    """Get list of cache entries that need refreshing"""
    try:
        optimizer = CacheOptimizer()
        candidates = optimizer.get_priority_refresh_list(db)
        
        return {
            "status": "success",
            "refresh_candidates": candidates,
            "total_candidates": len(candidates),
            "message": f"Found {len(candidates)} cache entries that need refreshing"
        }
        
    except Exception as e:
        logger.error(f"Error getting refresh candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Refresh candidates error: {str(e)}")

@router.post("/cache/clear-expired")
async def clear_expired_cache(db: Session = Depends(get_db)):
    """Clear expired cache entries to free up space"""
    try:
        from app.database import VendorCache
        from datetime import datetime
        
        # Count expired entries before deletion
        expired_count = db.query(VendorCache).filter(
            VendorCache.expires_at < datetime.utcnow()
        ).count()
        
        # Delete expired entries
        deleted = db.query(VendorCache).filter(
            VendorCache.expires_at < datetime.utcnow()
        ).delete()
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Cleared {deleted} expired cache entries",
            "entries_cleared": deleted,
            "space_optimized": True
        }
        
    except Exception as e:
        logger.error(f"Error clearing expired cache: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Clear expired cache error: {str(e)}")

def _generate_cache_recommendations(status: Dict) -> List[str]:
    """Generate actionable recommendations based on cache status"""
    recommendations = []
    
    if status.get("cache_freshness_percentage", 0) < 70:
        recommendations.append("Cache freshness is low - consider running cache optimization")
    
    if status.get("average_cache_age_hours", 0) > 16:
        recommendations.append("Average cache age is high - recommend background refresh")
    
    if status.get("expired_items", 0) > status.get("total_cached_items", 1) * 0.3:
        recommendations.append("High number of expired entries - run clear expired cache")
    
    if not recommendations:
        recommendations.append("Cache performance is optimal")
    
    return recommendations

async def _background_optimization(optimizer: CacheOptimizer, db: Session):
    """Background task for cache optimization"""
    try:
        logger.info("Starting background cache optimization")
        
        # Perform background refresh
        refresh_result = optimizer.background_cache_refresh(db)
        logger.info(f"Background refresh completed: {refresh_result}")
        
        # Optimize cache expiry times
        expiry_result = optimizer.optimize_cache_expiry(db)
        logger.info(f"Cache expiry optimization completed: {expiry_result}")
        
    except Exception as e:
        logger.error(f"Error in background optimization: {e}")

async def _background_preload(optimizer: CacheOptimizer, symbols: List[str]):
    """Background task for data preloading"""
    try:
        logger.info(f"Starting background preload for symbols: {symbols}")
        
        result = optimizer.preload_comprehensive_data(symbols)
        
        logger.info(f"Background preload completed: {result}")
        
    except Exception as e:
        logger.error(f"Error in background preload: {e}")