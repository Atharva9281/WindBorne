from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict
import json

from app.database import VendorCache, RiskScore, PortfolioMetric

class CacheManager:
    """Manages caching operations for vendor data and risk scores"""
    
    @staticmethod
    def get_cached_data(db: Session, symbol: str, data_type: str) -> Optional[Dict]:
        """Get cached data for a vendor symbol if still valid"""
        cached = db.query(VendorCache).filter(
            VendorCache.symbol == symbol,
            VendorCache.data_type == data_type,
            VendorCache.expires_at > datetime.utcnow()
        ).first()
        
        if cached:
            try:
                return json.loads(cached.content)
            except json.JSONDecodeError:
                # If JSON is corrupted, remove the cache entry
                db.delete(cached)
                db.commit()
                return None
        
        return None
    
    @staticmethod
    def set_cache_data(db: Session, symbol: str, data_type: str, data: Dict, expiry_hours: int = 24):
        """Cache data for a vendor symbol with specified expiry"""
        expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
        
        # Remove existing cache for this symbol and data type
        existing = db.query(VendorCache).filter(
            VendorCache.symbol == symbol,
            VendorCache.data_type == data_type
        ).first()
        
        if existing:
            existing.content = json.dumps(data)
            existing.timestamp = datetime.utcnow()
            existing.expires_at = expires_at
        else:
            cache_entry = VendorCache(
                symbol=symbol,
                data_type=data_type,
                content=json.dumps(data),
                expires_at=expires_at
            )
            db.add(cache_entry)
        
        db.commit()
    
    @staticmethod
    def clear_expired_cache(db: Session):
        """Remove all expired cache entries"""
        expired_count = db.query(VendorCache).filter(
            VendorCache.expires_at < datetime.utcnow()
        ).delete()
        
        db.commit()
        return expired_count
    
    @staticmethod
    def clear_vendor_cache(db: Session, symbol: str):
        """Clear all cache entries for a specific vendor"""
        deleted_count = db.query(VendorCache).filter(
            VendorCache.symbol == symbol
        ).delete()
        
        db.commit()
        return deleted_count
    
    @staticmethod
    def get_cache_stats(db: Session) -> Dict:
        """Get cache statistics"""
        total_entries = db.query(VendorCache).count()
        expired_entries = db.query(VendorCache).filter(
            VendorCache.expires_at < datetime.utcnow()
        ).count()
        
        # Get data type breakdown
        overview_count = db.query(VendorCache).filter(
            VendorCache.data_type == "overview"
        ).count()
        
        income_count = db.query(VendorCache).filter(
            VendorCache.data_type == "income_statement"
        ).count()
        
        return {
            "totalEntries": total_entries,
            "expiredEntries": expired_entries,
            "validEntries": total_entries - expired_entries,
            "byType": {
                "overview": overview_count,
                "income_statement": income_count
            }
        }
    
    @staticmethod
    def update_risk_scores(db: Session, symbol: str, financial_health: int, 
                          market_stability: int, growth_prospects: int, overall_risk: str):
        """Update or create risk scores for a vendor"""
        existing = db.query(RiskScore).filter(RiskScore.symbol == symbol).first()
        
        if existing:
            existing.financial_health = financial_health
            existing.market_stability = market_stability
            existing.growth_prospects = growth_prospects
            existing.overall_risk = overall_risk
            existing.updated_at = datetime.utcnow()
        else:
            risk_score = RiskScore(
                symbol=symbol,
                financial_health=financial_health,
                market_stability=market_stability,
                growth_prospects=growth_prospects,
                overall_risk=overall_risk
            )
            db.add(risk_score)
        
        db.commit()
    
    @staticmethod
    def get_portfolio_metrics_cache(db: Session) -> Optional[Dict]:
        """Get cached portfolio metrics if they exist and are recent"""
        # Consider metrics valid for 1 hour
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        recent_metrics = db.query(PortfolioMetric).filter(
            PortfolioMetric.calculated_at > one_hour_ago
        ).all()
        
        if recent_metrics:
            return {metric.metric_name: metric.metric_value for metric in recent_metrics}
        
        return None
    
    @staticmethod
    def set_portfolio_metrics_cache(db: Session, metrics: Dict):
        """Cache portfolio metrics"""
        # Clear old metrics
        db.query(PortfolioMetric).delete()
        
        # Add new metrics
        for key, value in metrics.items():
            metric = PortfolioMetric(
                metric_name=key,
                metric_value=str(value)
            )
            db.add(metric)
        
        db.commit()