import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from concurrent.futures import ThreadPoolExecutor
import json

from app.database import SessionLocal, VendorCache, CacheStats
from app.services.alpha_vantage import AlphaVantageService
from app.services.risk_calculator import RiskCalculator

logger = logging.getLogger(__name__)

class CacheOptimizer:
    """Intelligent cache management for enhanced performance"""
    
    def __init__(self):
        self.alpha_service = AlphaVantageService()
        
    def analyze_cache_usage(self, db: Session) -> Dict:
        """Analyze cache hit rates and identify optimization opportunities"""
        try:
            # Get cache statistics
            total_entries = db.query(VendorCache).count()
            expired_entries = db.query(VendorCache).filter(
                VendorCache.expires_at < datetime.utcnow()
            ).count()
            
            # Calculate cache efficiency
            fresh_entries = total_entries - expired_entries
            cache_freshness = (fresh_entries / total_entries * 100) if total_entries > 0 else 0
            
            # Get cache age distribution
            cache_ages = db.query(VendorCache.created_at).all()
            if cache_ages:
                now = datetime.utcnow()
                ages = [(now - age[0]).total_seconds() / 3600 for age in cache_ages]  # Hours
                avg_age = sum(ages) / len(ages)
            else:
                avg_age = 0
                
            return {
                "total_cached_items": total_entries,
                "expired_items": expired_entries,
                "cache_freshness_percentage": round(cache_freshness, 2),
                "average_cache_age_hours": round(avg_age, 2),
                "optimization_needed": cache_freshness < 80 or avg_age > 12
            }
            
        except Exception as e:
            logger.error(f"Error analyzing cache usage: {e}")
            return {"error": str(e)}
    
    def get_priority_refresh_list(self, db: Session) -> List[str]:
        """Get list of symbols that need priority refresh based on usage patterns"""
        try:
            # Find entries that are about to expire (within 2 hours)
            near_expiry = db.query(VendorCache).filter(
                VendorCache.expires_at < datetime.utcnow() + timedelta(hours=2)
            ).all()
            
            # Extract unique symbols
            priority_symbols = list(set([cache.symbol for cache in near_expiry]))
            
            logger.info(f"Identified {len(priority_symbols)} symbols for priority refresh")
            return priority_symbols
            
        except Exception as e:
            logger.error(f"Error getting priority refresh list: {e}")
            return []
    
    def preload_comprehensive_data(self, symbols: List[str]) -> Dict:
        """Preload comprehensive data for multiple vendors in parallel"""
        try:
            logger.info(f"Preloading comprehensive data for {len(symbols)} vendors")
            
            def preload_vendor(symbol: str) -> Dict:
                """Preload data for a single vendor"""
                db = SessionLocal()
                try:
                    # Fetch all three endpoints in parallel for this vendor
                    with ThreadPoolExecutor(max_workers=3) as executor:
                        overview_future = executor.submit(self.alpha_service.get_company_overview, symbol)
                        income_future = executor.submit(self.alpha_service.get_income_statement, symbol)
                        balance_future = executor.submit(self.alpha_service.get_balance_sheet, symbol)
                        
                        overview = overview_future.result()
                        income_statement = income_future.result()
                        balance_sheet = balance_future.result()
                    
                    if not overview:
                        return {"symbol": symbol, "status": "failed", "error": "No overview data"}
                    
                    # Parse comprehensive data
                    financial_data = self.alpha_service.parse_financial_data(overview, income_statement, balance_sheet)
                    
                    # Cache the comprehensive data
                    self._cache_vendor_data(db, symbol, "comprehensive", json.dumps(financial_data))
                    
                    # Also cache individual components for flexibility
                    self._cache_vendor_data(db, symbol, "overview", json.dumps(overview))
                    if income_statement:
                        self._cache_vendor_data(db, symbol, "income", json.dumps(income_statement))
                    if balance_sheet:
                        self._cache_vendor_data(db, symbol, "balance_sheet", json.dumps(balance_sheet))
                    
                    return {"symbol": symbol, "status": "success", "cached_data_types": ["comprehensive", "overview", "income", "balance_sheet"]}
                    
                except Exception as e:
                    logger.error(f"Error preloading data for {symbol}: {e}")
                    return {"symbol": symbol, "status": "failed", "error": str(e)}
                finally:
                    db.close()
            
            # Process all vendors in parallel
            with ThreadPoolExecutor(max_workers=min(len(symbols), 5)) as executor:
                results = list(executor.map(preload_vendor, symbols))
            
            successful = len([r for r in results if r["status"] == "success"])
            
            return {
                "total_processed": len(results),
                "successful": successful,
                "failed": len(results) - successful,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Error in preload_comprehensive_data: {e}")
            return {"error": str(e)}
    
    def background_cache_refresh(self, db: Session) -> Dict:
        """Perform background refresh of stale cache entries"""
        try:
            # Get priority refresh list
            priority_symbols = self.get_priority_refresh_list(db)
            
            if not priority_symbols:
                return {"message": "No cache refresh needed", "refreshed": 0}
            
            # Limit to 5 symbols per background refresh to avoid API throttling
            symbols_to_refresh = priority_symbols[:5]
            
            logger.info(f"Background refreshing cache for: {symbols_to_refresh}")
            
            # Preload fresh data
            refresh_result = self.preload_comprehensive_data(symbols_to_refresh)
            
            # Update cache statistics
            self._update_cache_stats(db, refresh_result)
            
            return {
                "message": f"Background refresh completed for {refresh_result['successful']} vendors",
                "symbols_refreshed": symbols_to_refresh,
                "successful": refresh_result["successful"],
                "failed": refresh_result["failed"]
            }
            
        except Exception as e:
            logger.error(f"Error in background_cache_refresh: {e}")
            return {"error": str(e)}
    
    def optimize_cache_expiry(self, db: Session, usage_patterns: Optional[Dict] = None) -> Dict:
        """Dynamically optimize cache expiry times based on usage patterns"""
        try:
            # Default cache durations (in hours)
            default_durations = {
                "comprehensive": 24,  # Full financial data
                "overview": 12,       # Company overview
                "income": 24,         # Income statement  
                "balance_sheet": 48   # Balance sheet (most stable)
            }
            
            # If usage patterns provided, adjust expiry times
            if usage_patterns:
                # High-usage vendors get longer cache times
                for data_type, hours in default_durations.items():
                    if data_type in usage_patterns.get("high_usage_types", []):
                        default_durations[data_type] = int(hours * 1.5)
            
            # Update existing cache entries with optimized expiry times
            updated_count = 0
            for data_type, hours in default_durations.items():
                new_expiry = datetime.utcnow() + timedelta(hours=hours)
                
                # Update non-expired entries of this type
                updated = db.query(VendorCache).filter(
                    VendorCache.data_type == data_type,
                    VendorCache.expires_at > datetime.utcnow()
                ).update({"expires_at": new_expiry})
                
                updated_count += updated
            
            db.commit()
            
            return {
                "message": "Cache expiry optimization completed",
                "updated_entries": updated_count,
                "new_durations": default_durations
            }
            
        except Exception as e:
            logger.error(f"Error optimizing cache expiry: {e}")
            db.rollback()
            return {"error": str(e)}
    
    def _cache_vendor_data(self, db: Session, symbol: str, data_type: str, content: str):
        """Helper to cache vendor data with optimized expiry"""
        try:
            # Set expiry based on data type
            expiry_hours = {
                "comprehensive": 24,
                "overview": 12,
                "income": 24,
                "balance_sheet": 48
            }.get(data_type, 12)
            
            expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
            
            # Remove old cache for this symbol and data type
            db.query(VendorCache).filter(
                VendorCache.symbol == symbol,
                VendorCache.data_type == data_type
            ).delete()
            
            # Add new cache entry
            cache_entry = VendorCache(
                symbol=symbol,
                data_type=data_type,
                content=content,
                expires_at=expires_at,
                created_at=datetime.utcnow()
            )
            
            db.add(cache_entry)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error caching data for {symbol} ({data_type}): {e}")
            db.rollback()
    
    def _update_cache_stats(self, db: Session, operation_result: Dict):
        """Update cache statistics after operations"""
        try:
            stats = CacheStats(
                operation_type="background_refresh",
                items_processed=operation_result.get("total_processed", 0),
                items_successful=operation_result.get("successful", 0),
                items_failed=operation_result.get("failed", 0),
                execution_time_seconds=0,  # Could be enhanced to track actual time
                created_at=datetime.utcnow()
            )
            
            db.add(stats)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error updating cache stats: {e}")
            db.rollback()