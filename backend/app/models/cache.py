from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import Optional, Dict
import json

Base = declarative_base()

class VendorCache(Base):
    """Cache table for Alpha Vantage API responses"""
    __tablename__ = "vendor_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    data_type = Column(String(50), nullable=False)  # 'overview' or 'income_statement'
    content = Column(Text, nullable=False)  # JSON string of API response
    timestamp = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Composite index for efficient lookups
    __table_args__ = (
        Index('idx_symbol_data_type', 'symbol', 'data_type'),
        Index('idx_expires_at', 'expires_at'),
    )
    
    @classmethod
    def create_cache_entry(cls, symbol: str, data_type: str, content: Dict, expiry_hours: int = 24):
        """Create a new cache entry"""
        expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
        
        return cls(
            symbol=symbol.upper(),
            data_type=data_type,
            content=json.dumps(content),
            expires_at=expires_at
        )
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        return datetime.utcnow() > self.expires_at
    
    def get_content(self) -> Optional[Dict]:
        """Get parsed content from cache"""
        try:
            return json.loads(self.content)
        except json.JSONDecodeError:
            return None
    
    def update_content(self, content: Dict, expiry_hours: int = 24):
        """Update cache content and expiry"""
        self.content = json.dumps(content)
        self.timestamp = datetime.utcnow()
        self.expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)


class RiskScore(Base):
    """Risk scores for vendors"""
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, unique=True, index=True)
    financial_health = Column(Integer, nullable=False)  # 0-100 score
    market_stability = Column(Integer, nullable=False)  # 0-100 score  
    growth_prospects = Column(Integer, nullable=False)  # 0-100 score
    overall_risk = Column(String(20), nullable=False)   # 'low', 'medium', 'high'
    risk_score = Column(Integer, nullable=False)        # Combined score 0-100
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    def calculate_combined_score(self) -> int:
        """Calculate combined risk score from individual components"""
        return int((self.financial_health + self.market_stability + self.growth_prospects) / 3)
    
    def update_scores(self, financial_health: int, market_stability: int, growth_prospects: int, overall_risk: str):
        """Update all risk scores"""
        self.financial_health = financial_health
        self.market_stability = market_stability
        self.growth_prospects = growth_prospects
        self.overall_risk = overall_risk
        self.risk_score = self.calculate_combined_score()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            "symbol": self.symbol,
            "financialHealth": self.financial_health,
            "marketStability": self.market_stability,
            "growthProspects": self.growth_prospects,
            "overallRisk": self.overall_risk,
            "riskScore": self.risk_score,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


class PortfolioMetric(Base):
    """Cache for calculated portfolio KPI metrics"""
    __tablename__ = "portfolio_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False, unique=True, index=True)
    metric_value = Column(String(255), nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Index for efficient lookups by calculation time
    __table_args__ = (
        Index('idx_calculated_at', 'calculated_at'),
    )
    
    @classmethod
    def update_metric(cls, session, metric_name: str, metric_value: str):
        """Update or create a portfolio metric"""
        metric = session.query(cls).filter(cls.metric_name == metric_name).first()
        
        if metric:
            metric.metric_value = metric_value
            metric.calculated_at = datetime.utcnow()
        else:
            metric = cls(
                metric_name=metric_name,
                metric_value=metric_value
            )
            session.add(metric)
        
        return metric
    
    @classmethod
    def get_all_metrics(cls, session, max_age_hours: int = 1) -> Dict[str, str]:
        """Get all current portfolio metrics"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        metrics = session.query(cls).filter(cls.calculated_at >= cutoff_time).all()
        
        return {metric.metric_name: metric.metric_value for metric in metrics}
    
    @classmethod
    def clear_old_metrics(cls, session, max_age_hours: int = 24):
        """Clear old metric entries"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        deleted_count = session.query(cls).filter(cls.calculated_at < cutoff_time).delete()
        session.commit()
        
        return deleted_count
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            "metricName": self.metric_name,
            "metricValue": self.metric_value,
            "calculatedAt": self.calculated_at.isoformat() if self.calculated_at else None
        }


class CacheStats(Base):
    """Statistics tracking for cache performance"""
    __tablename__ = "cache_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), nullable=False, unique=True, index=True)  # YYYY-MM-DD format
    api_calls_made = Column(Integer, default=0)
    cache_hits = Column(Integer, default=0)
    cache_misses = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    @classmethod
    def get_or_create_today(cls, session):
        """Get or create stats entry for today"""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        stats = session.query(cls).filter(cls.date == today).first()
        
        if not stats:
            stats = cls(date=today)
            session.add(stats)
            session.commit()
        
        return stats
    
    def increment_api_calls(self, session):
        """Increment API calls counter"""
        self.api_calls_made += 1
        self.updated_at = datetime.utcnow()
        session.commit()
    
    def increment_cache_hit(self, session):
        """Increment cache hits counter"""
        self.cache_hits += 1
        self.updated_at = datetime.utcnow()
        session.commit()
    
    def increment_cache_miss(self, session):
        """Increment cache misses counter"""
        self.cache_misses += 1
        self.updated_at = datetime.utcnow()
        session.commit()
    
    def increment_errors(self, session):
        """Increment errors counter"""
        self.errors_count += 1
        self.updated_at = datetime.utcnow()
        session.commit()
    
    def get_cache_hit_rate(self) -> float:
        """Calculate cache hit rate percentage"""
        total_requests = self.cache_hits + self.cache_misses
        if total_requests == 0:
            return 0.0
        return (self.cache_hits / total_requests) * 100
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            "date": self.date,
            "apiCallsMade": self.api_calls_made,
            "cacheHits": self.cache_hits,
            "cacheMisses": self.cache_misses,
            "errorsCount": self.errors_count,
            "cacheHitRate": f"{self.get_cache_hit_rate():.1f}%",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }