from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import logging
from datetime import datetime, timedelta

from app.database import get_db, VendorCache, RiskScore, SessionLocal
from app.services.alpha_vantage import AlphaVantageService
from app.services.risk_calculator import RiskCalculator

# Set up comprehensive logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# WindBorne tracked vendors as specified in requirements
WINDBORNE_VENDORS = [
    {"symbol": "TEL", "name": "TE Connectivity", "type": "Sensor Supplier"},
    {"symbol": "ST", "name": "Sensata Technologies", "type": "Sensor Supplier"},
    {"symbol": "DD", "name": "DuPont de Nemours", "type": "Materials Supplier"},
    {"symbol": "CE", "name": "Celanese Corporation", "type": "Materials Supplier"},
    {"symbol": "LYB", "name": "LyondellBasell Industries", "type": "Materials Supplier"}
]

@router.get("/vendors")
async def get_vendors(db: Session = Depends(get_db)):
    """Get all vendor data with risk calculations - optimized for parallel processing"""
    try:
        logger.info("Starting optimized vendor data fetch for all WindBorne vendors")
        alpha_service = AlphaVantageService()
        vendors_data = []
        
        # Process vendors in parallel for much faster loading
        import asyncio
        from concurrent.futures import ThreadPoolExecutor
        import threading
        
        def process_single_vendor(vendor_info):
            """Process a single vendor with comprehensive data fetching"""
            vendor = vendor_info
            thread_db = SessionLocal()  # Create thread-local DB session
            
            try:
                logger.info(f"Processing vendor: {vendor['symbol']} - {vendor['name']}")
                
                # Check cache first (try comprehensive, then overview)
                cached_data = get_cached_vendor_data(thread_db, vendor["symbol"], "comprehensive")
                if not cached_data:
                    cached_data = get_cached_vendor_data(thread_db, vendor["symbol"], "overview")
                
                if cached_data:
                    # Use cached data
                    logger.info(f"Using cached {cached_data.data_type} data for {vendor['symbol']}")
                    financial_data = json.loads(cached_data.content)
                else:
                    # Fetch all data in parallel for this vendor
                    logger.info(f"Fetching comprehensive data from Alpha Vantage for {vendor['symbol']}")
                    
                    # Parallel API calls for this vendor
                    with ThreadPoolExecutor(max_workers=3) as executor:
                        overview_future = executor.submit(alpha_service.get_company_overview, vendor["symbol"])
                        income_future = executor.submit(alpha_service.get_income_statement, vendor["symbol"])
                        balance_future = executor.submit(alpha_service.get_balance_sheet, vendor["symbol"])
                        
                        # Get results
                        overview = overview_future.result()
                        income_statement = income_future.result()
                        balance_sheet = balance_future.result()
                    
                    if not overview:
                        logger.warning(f"No Alpha Vantage overview data for {vendor['symbol']}, skipping")
                        return None
                    
                    # Parse all data together
                    financial_data = alpha_service.parse_financial_data(overview, income_statement, balance_sheet)
                    
                    # Cache the comprehensive data
                    cache_vendor_data(thread_db, vendor["symbol"], "comprehensive", json.dumps(financial_data))
                
                # Calculate risk scores with extra validation
                logger.info(f"Calculating risk scores for {vendor['symbol']}")
                risk_result = RiskCalculator.calculate_risk_score(financial_data)
                
                # Extract values with validation and ensure they're never None
                financial_health = max(0, min(100, int(risk_result.get("financial_health", 50) or 50)))
                market_stability = max(0, min(100, int(risk_result.get("market_stability", 50) or 50)))
                growth_prospects = max(0, min(100, int(risk_result.get("growth_prospects", 50) or 50)))
                financial_stability = max(0, min(100, int(risk_result.get("financial_stability", 50) or 50)))
                risk_score = max(0, min(100, int(risk_result.get("risk_score", 50) or 50)))
                overall_risk = str(risk_result.get("overall_risk", "medium") or "medium")
                
                # Validate overall_risk is a valid value
                if overall_risk not in ["low", "medium", "high"]:
                    overall_risk = "medium"
                    
                logger.info(f"Risk scores for {vendor['symbol']}: FH={financial_health}, MS={market_stability}, GP={growth_prospects}, FS={financial_stability}, Overall={overall_risk}, Score={risk_score}")
                
                # Format vendor data
                vendor_data = {
                    "id": 0,  # Will be set after parallel processing
                    "name": financial_data.get("name", vendor["name"]),
                    "symbol": financial_data.get("symbol", vendor["symbol"]),
                    "vendorType": financial_data.get("vendor_type", vendor["type"]),
                    "industry": financial_data.get("industry", "Sensors" if "Sensor" in vendor["type"] else "Materials"),
                    "marketCap": financial_data.get("market_cap", 0),
                    "profitMargin": financial_data.get("profit_margin", 0),
                    "revenue": financial_data.get("revenue", 0),
                    "weekHigh52": financial_data.get("week_high_52", 0),
                    "weekLow52": financial_data.get("week_low_52", 0),
                    "currentPrice": (financial_data.get("week_high_52", 0) + financial_data.get("week_low_52", 0)) / 2 if financial_data.get("week_high_52", 0) and financial_data.get("week_low_52", 0) else 0,
                    "risk": overall_risk,
                    "riskScore": risk_score,
                    "financialHealth": financial_health,
                    "marketStability": market_stability,
                    "growthProspects": growth_prospects,
                    "financialStability": financial_stability,
                    "peRatio": financial_data.get("pe_ratio", 0),
                    "beta": financial_data.get("beta", 0),
                    "roe": financial_data.get("roe", 0),
                    "debtToEquity": financial_data.get("debt_to_equity", 0),
                    "balanceSheet": financial_data.get("balance_sheet", {}),
                    "financialRatios": financial_data.get("financial_ratios", {}),
                    "lastUpdated": financial_data.get("last_updated", datetime.utcnow().isoformat())
                }
                
                # Save risk scores to database
                try:
                    save_risk_scores(thread_db, vendor["symbol"], financial_health, market_stability, growth_prospects, overall_risk, risk_score)
                    logger.info(f"Successfully saved risk scores for {vendor['symbol']}")
                except Exception as save_error:
                    logger.error(f"Failed to save risk scores for {vendor['symbol']}: {save_error}")
                
                return vendor_data
                    
            except Exception as vendor_error:
                logger.error(f"Error processing vendor {vendor['symbol']}: {vendor_error}")
                # Return a basic fallback vendor entry
                return {
                    "id": 0,
                    "name": vendor["name"],
                    "symbol": vendor["symbol"],
                    "vendorType": vendor["type"],
                    "industry": "Sensors" if "Sensor" in vendor["type"] else "Materials",
                    "marketCap": 0,
                    "profitMargin": 0,
                    "revenue": 0,
                    "weekHigh52": 0,
                    "weekLow52": 0,
                    "currentPrice": 0,
                    "risk": "medium",
                    "riskScore": 50,
                    "financialHealth": 50,
                    "marketStability": 50,
                    "growthProspects": 50,
                    "financialStability": 50,
                    "peRatio": 0,
                    "beta": 0,
                    "roe": 0,
                    "debtToEquity": 0,
                    "balanceSheet": {},
                    "financialRatios": {},
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            finally:
                thread_db.close()
        
        # Process all vendors in parallel
        with ThreadPoolExecutor(max_workers=len(WINDBORNE_VENDORS)) as executor:
            vendor_futures = [executor.submit(process_single_vendor, vendor) for vendor in WINDBORNE_VENDORS]
            
            # Collect results
            for i, future in enumerate(vendor_futures):
                try:
                    result = future.result(timeout=60)  # 60 second timeout per vendor
                    if result:
                        result["id"] = i + 1
                        vendors_data.append(result)
                except Exception as e:
                    logger.error(f"Failed to process vendor {WINDBORNE_VENDORS[i]['symbol']}: {e}")
                    continue
        
        return {"vendors": vendors_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vendor data: {str(e)}")

@router.get("/vendors/{symbol}")
async def get_vendor_detail(symbol: str, db: Session = Depends(get_db)):
    """Get detailed information for a specific vendor"""
    try:
        # Validate symbol against WindBorne tracked vendors
        tracked_symbols = [v["symbol"] for v in WINDBORNE_VENDORS]
        if symbol.upper() not in tracked_symbols:
            raise HTTPException(status_code=404, detail=f"Vendor {symbol} not found in tracked vendors")
        
        alpha_service = AlphaVantageService()
        
        # Get company overview
        overview = alpha_service.get_company_overview(symbol)
        if not overview:
            raise HTTPException(status_code=404, detail=f"Vendor data not available from Alpha Vantage for {symbol}")
        
        # Get income statement for quarterly data
        income_statement = alpha_service.get_income_statement(symbol)
        
        # Get balance sheet for comprehensive financial analysis
        balance_sheet = alpha_service.get_balance_sheet(symbol)
        
        # Parse financial data with balance sheet
        financial_data = alpha_service.parse_financial_data(overview, income_statement, balance_sheet)
        
        # Calculate risk scores with validation
        risk_result = RiskCalculator.calculate_risk_score(financial_data)
        financial_health = max(0, min(100, int(risk_result.get("financial_health", 50) or 50)))
        market_stability = max(0, min(100, int(risk_result.get("market_stability", 50) or 50)))
        growth_prospects = max(0, min(100, int(risk_result.get("growth_prospects", 50) or 50)))
        risk_score = max(0, min(100, int(risk_result.get("risk_score", 50) or 50)))
        overall_risk = str(risk_result.get("overall_risk", "medium") or "medium")
        
        # Validate overall_risk is a valid value
        if overall_risk not in ["low", "medium", "high"]:
            overall_risk = "medium"
        
        vendor_detail = {
            "symbol": symbol,
            "name": financial_data.get("name", ""),
            "industry": financial_data.get("industry", ""),
            "vendorType": financial_data.get("vendor_type", ""),
            "marketCap": financial_data.get("market_cap", 0),
            "revenue": financial_data.get("revenue", 0),
            "profitMargin": financial_data.get("profit_margin", 0),
            "peRatio": financial_data.get("pe_ratio", 0),
            "beta": financial_data.get("beta", 0),
            "roe": financial_data.get("roe", 0),
            "debtToEquity": financial_data.get("debt_to_equity", 0),
            "weekHigh52": financial_data.get("week_high_52", 0),
            "weekLow52": financial_data.get("week_low_52", 0),
            "quarterlyRevenue": financial_data.get("quarterly_revenue", []),
            "balanceSheet": financial_data.get("balance_sheet", {}),
            "financialRatios": financial_data.get("financial_ratios", {}),
            "riskScores": {
                "financialHealth": financial_health,
                "marketStability": market_stability,
                "growthProspects": growth_prospects,
                "riskScore": risk_score,
                "overall": overall_risk
            },
            "lastUpdated": financial_data.get("last_updated", datetime.utcnow().isoformat())
        }
        
        return vendor_detail
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vendor detail: {str(e)}")

@router.get("/vendors/{symbol}/refresh")
async def refresh_vendor_data(symbol: str, db: Session = Depends(get_db)):
    """Force refresh cached data for a specific vendor"""
    try:
        # Clear existing cache
        db.query(VendorCache).filter(VendorCache.symbol == symbol.upper()).delete()
        db.commit()
        
        # Fetch fresh data from Alpha Vantage
        alpha_service = AlphaVantageService()
        
        overview = alpha_service.get_company_overview(symbol)
        if not overview:
            raise HTTPException(status_code=404, detail="Vendor data not available from Alpha Vantage")
        
        # Get income statement for more complete data
        income_statement = alpha_service.get_income_statement(symbol)
        
        # Parse and cache the data
        financial_data = alpha_service.parse_financial_data(overview, income_statement)
        cache_vendor_data(db, symbol.upper(), "overview", json.dumps(financial_data))
        
        # Calculate new risk scores with validation
        risk_result = RiskCalculator.calculate_risk_score(financial_data)
        financial_health = max(0, min(100, int(risk_result.get("financial_health", 50) or 50)))
        market_stability = max(0, min(100, int(risk_result.get("market_stability", 50) or 50)))
        growth_prospects = max(0, min(100, int(risk_result.get("growth_prospects", 50) or 50)))
        risk_score = max(0, min(100, int(risk_result.get("risk_score", 50) or 50)))
        overall_risk = str(risk_result.get("overall_risk", "medium") or "medium")
        
        # Validate overall_risk is a valid value
        if overall_risk not in ["low", "medium", "high"]:
            overall_risk = "medium"
        
        save_risk_scores(db, symbol.upper(), financial_health, market_stability, growth_prospects, overall_risk, risk_score)
        
        return {
            "message": f"Data refreshed successfully for {symbol.upper()}",
            "symbol": symbol.upper(),
            "refreshedAt": datetime.utcnow().isoformat(),
            "riskScores": {
                "financialHealth": financial_health,
                "marketStability": market_stability,
                "growthProspects": growth_prospects,
                "overall": overall_risk
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing vendor data: {str(e)}")

def get_cached_vendor_data(db: Session, symbol: str, data_type: str):
    """Check if we have cached data that's still valid"""
    cached = db.query(VendorCache).filter(
        VendorCache.symbol == symbol,
        VendorCache.data_type == data_type,
        VendorCache.expires_at > datetime.utcnow()
    ).first()
    
    return cached

def cache_vendor_data(db: Session, symbol: str, data_type: str, content: str):
    """Cache vendor data with expiration"""
    expires_at = datetime.utcnow() + timedelta(hours=24)  # Cache for 24 hours
    
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
        expires_at=expires_at
    )
    
    db.add(cache_entry)
    db.commit()

def save_risk_scores(db: Session, symbol: str, financial_health: int, market_stability: int, growth_prospects: int, overall_risk: str, risk_score: int):
    """Save or update risk scores for a vendor"""
    try:
        logger.info(f"Saving risk scores for {symbol}: FH={financial_health}, MS={market_stability}, GP={growth_prospects}, Overall={overall_risk}, Score={risk_score}")
        
        # Validate all values are not None and are valid
        if any(val is None for val in [financial_health, market_stability, growth_prospects, risk_score]):
            raise ValueError(f"Cannot save None values for {symbol}")
        
        if overall_risk not in ["low", "medium", "high"]:
            raise ValueError(f"Invalid overall_risk value: {overall_risk}")
        
        # Remove old risk scores
        deleted_count = db.query(RiskScore).filter(RiskScore.symbol == symbol).delete()
        logger.info(f"Deleted {deleted_count} old risk scores for {symbol}")
        
        # Add new risk scores
        new_risk_score = RiskScore(
            symbol=symbol,
            financial_health=int(financial_health),
            market_stability=int(market_stability),
            growth_prospects=int(growth_prospects),
            overall_risk=str(overall_risk),
            risk_score=int(risk_score)
        )
        
        db.add(new_risk_score)
        db.commit()
        logger.info(f"Successfully committed risk scores for {symbol}")
        
    except Exception as e:
        logger.error(f"Error saving risk scores for {symbol}: {e}")
        db.rollback()
        raise