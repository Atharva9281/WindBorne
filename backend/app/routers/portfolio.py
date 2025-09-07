from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

from app.database import get_db, PortfolioMetric, RiskScore, VendorCache
from app.services.alpha_vantage import AlphaVantageService

router = APIRouter()

@router.get("/portfolio/kpis")
async def get_portfolio_metrics(db: Session = Depends(get_db)):
    """Get KPI metrics for the vendor portfolio"""
    try:
        # Get all risk scores
        risk_scores = db.query(RiskScore).all()
        
        if not risk_scores:
            # Return default metrics if no data
            return get_default_portfolio_kpis()
        
        # Calculate metrics from risk scores and cached data
        total_vendors = len(risk_scores)
        total_portfolio_value = 0
        total_profit_margin = 0
        high_risk_count = 0
        best_vendor = None
        best_score = 0
        
        # Get market cap and profit margin from cached vendor data
        for risk_score in risk_scores:
            try:
                cached_data = db.query(VendorCache).filter(
                    VendorCache.symbol == risk_score.symbol,
                    VendorCache.data_type == "overview"
                ).first()
                
                if cached_data:
                    try:
                        vendor_data = json.loads(cached_data.content)
                        market_cap = float(vendor_data.get("market_cap", 0) or 0)
                        profit_margin = float(vendor_data.get("profit_margin", 0) or 0)
                        vendor_name = vendor_data.get("name", risk_score.symbol)
                    except (json.JSONDecodeError, ValueError, TypeError):
                        # Use fallback values if data parsing fails
                        market_cap = 0
                        profit_margin = 0
                        vendor_name = risk_score.symbol
                else:
                    # No cached data available - use defaults
                    market_cap = 0
                    profit_margin = 0
                    vendor_name = risk_score.symbol
                
                total_portfolio_value += market_cap
                total_profit_margin += profit_margin
                
                if risk_score.overall_risk == "high":
                    high_risk_count += 1
                
                # Find best performing vendor (highest combined score)
                # Safely handle potential None values
                financial_health = risk_score.financial_health or 0
                market_stability = risk_score.market_stability or 0
                growth_prospects = risk_score.growth_prospects or 0
                
                combined_score = (financial_health + market_stability + growth_prospects) / 3
                if combined_score > best_score:
                    best_score = combined_score
                    best_vendor = vendor_name
                    
            except Exception as vendor_error:
                # Log error but continue processing other vendors
                logger.error(f"Error processing vendor {risk_score.symbol}: {vendor_error}", exc_info=True)
                continue
        
        # Calculate averages with safety checks
        avg_profit_margin = total_profit_margin / total_vendors if total_vendors > 0 else 0
        
        # Calculate average risk score with null-safe handling
        valid_risk_scores = []
        for rs in risk_scores:
            try:
                financial_health = rs.financial_health or 0
                market_stability = rs.market_stability or 0
                growth_prospects = rs.growth_prospects or 0
                combined = (financial_health + market_stability + growth_prospects) / 3
                valid_risk_scores.append(combined)
            except (AttributeError, TypeError):
                continue
        
        avg_risk_score = sum(valid_risk_scores) / len(valid_risk_scores) if valid_risk_scores else 0
        
        # Format portfolio value safely
        portfolio_value_formatted = f"${total_portfolio_value / 1_000_000_000:.1f}B" if total_portfolio_value > 0 else "$0B"
        
        metrics = {
            "totalPortfolioValue": portfolio_value_formatted,
            "avgProfitMargin": f"{avg_profit_margin:.1f}%",
            "activeVendors": total_vendors,
            "avgRiskScore": round(avg_risk_score) if avg_risk_score else 0,
            "highRiskVendors": high_risk_count,
            "topPerformingVendor": best_vendor or "N/A"
        }
        
        # Save metrics to database
        try:
            save_portfolio_metrics(db, metrics)
        except Exception as save_error:
            # Log but don't fail the request if metric saving fails
            logger.warning(f"Could not save portfolio metrics: {save_error}", exc_info=True)
        
        return metrics
        
    except Exception as e:
        # Return default KPIs on any error
        logger.error(f"Error calculating portfolio metrics: {e}", exc_info=True)
        return get_default_portfolio_kpis()

# Alias for backward compatibility
@router.get("/portfolio/metrics")
async def get_portfolio_metrics_alias(db: Session = Depends(get_db)):
    """Alias for KPI metrics endpoint"""
    return await get_portfolio_metrics(db)

@router.get("/portfolio/risk-analysis")
async def get_risk_analysis(db: Session = Depends(get_db)):
    """Get detailed risk analysis for the portfolio"""
    try:
        risk_scores = db.query(RiskScore).all()
        
        if not risk_scores:
            return {
                "riskDistribution": {"low": 0, "medium": 0, "high": 0},
                "averageScores": {
                    "financialHealth": 0,
                    "marketStability": 0,
                    "growthProspects": 0
                },
                "riskTrends": [],
                "recommendations": []
            }
        
        # Calculate risk distribution
        risk_distribution = {"low": 0, "medium": 0, "high": 0}
        total_financial = 0
        total_stability = 0
        total_growth = 0
        
        for risk_score in risk_scores:
            risk_distribution[risk_score.overall_risk] += 1
            total_financial += risk_score.financial_health
            total_stability += risk_score.market_stability
            total_growth += risk_score.growth_prospects
        
        total_vendors = len(risk_scores)
        
        # Calculate averages
        avg_financial = total_financial / total_vendors
        avg_stability = total_stability / total_vendors
        avg_growth = total_growth / total_vendors
        
        # Generate recommendations based on portfolio analysis
        recommendations = generate_recommendations(risk_distribution, avg_financial, avg_stability, avg_growth)
        
        return {
            "riskDistribution": risk_distribution,
            "averageScores": {
                "financialHealth": round(avg_financial),
                "marketStability": round(avg_stability),
                "growthProspects": round(avg_growth)
            },
            "riskTrends": [],  # Could be populated with historical data
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating risk analysis: {str(e)}")

@router.get("/portfolio/performance")
async def get_portfolio_performance():
    """Get portfolio performance metrics over time"""
    # This would typically fetch historical data
    # For now, return mock performance data
    return {
        "performanceOverTime": [
            {"date": "2024-01", "value": 95.2},
            {"date": "2024-02", "value": 96.1},
            {"date": "2024-03", "value": 94.8},
            {"date": "2024-04", "value": 97.3},
            {"date": "2024-05", "value": 98.1},
            {"date": "2024-06", "value": 96.9}
        ],
        "benchmarkComparison": {
            "portfolio": 96.9,
            "benchmark": 94.2,
            "outperformance": 2.7
        },
        "volatility": 1.2,
        "sharpeRatio": 1.8
    }

def save_portfolio_metrics(db: Session, metrics: Dict):
    """Save portfolio metrics to database"""
    # Clear old metrics
    db.query(PortfolioMetric).delete()
    
    # Save new metrics
    for key, value in metrics.items():
        metric = PortfolioMetric(
            metric_name=key,
            metric_value=str(value)
        )
        db.add(metric)
    
    db.commit()

def generate_recommendations(risk_distribution: Dict, avg_financial: float, avg_stability: float, avg_growth: float) -> List[str]:
    """Generate portfolio recommendations based on risk analysis"""
    recommendations = []
    
    total_vendors = sum(risk_distribution.values())
    high_risk_percentage = (risk_distribution["high"] / total_vendors) * 100 if total_vendors > 0 else 0
    
    if high_risk_percentage > 30:
        recommendations.append("Consider reducing exposure to high-risk vendors to improve portfolio stability")
    
    if avg_financial < 60:
        recommendations.append("Focus on vendors with stronger financial health metrics")
    
    if avg_stability < 50:
        recommendations.append("Diversify vendor base to reduce market concentration risk")
    
    if avg_growth < 55:
        recommendations.append("Consider adding vendors with better growth prospects")
    
    if risk_distribution["low"] / total_vendors < 0.3 if total_vendors > 0 else True:
        recommendations.append("Increase allocation to low-risk, stable vendors")
    
    if not recommendations:
        recommendations.append("Portfolio risk profile is well-balanced. Continue monitoring vendor performance.")
    
    return recommendations

def get_default_portfolio_kpis() -> Dict:
    """Return default portfolio KPIs when no data is available"""
    return {
        "totalPortfolioValue": "$0B",
        "avgProfitMargin": "0%",
        "activeVendors": 0,
        "avgRiskScore": 0,
        "highRiskVendors": 0,
        "topPerformingVendor": "N/A"
    }