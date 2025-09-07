from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Dict
import csv
import json
import io
from datetime import datetime

from app.database import get_db, VendorCache, RiskScore

router = APIRouter()

@router.get("/export/csv")
async def export_vendors_csv(db: Session = Depends(get_db)):
    """Export vendor data to CSV format"""
    try:
        # Get all risk scores and vendor data
        risk_scores = db.query(RiskScore).all()
        vendor_data = []
        
        for risk_score in risk_scores:
            # Get cached vendor data
            cached_data = db.query(VendorCache).filter(
                VendorCache.symbol == risk_score.symbol,
                VendorCache.data_type == "overview"
            ).first()
            
            if cached_data:
                financial_data = json.loads(cached_data.content)
                
                vendor_row = {
                    "Symbol": risk_score.symbol,
                    "Company Name": financial_data.get("name", ""),
                    "Industry": financial_data.get("industry", ""),
                    "Vendor Type": financial_data.get("vendor_type", ""),
                    "Market Cap ($B)": f"{financial_data.get('market_cap', 0) / 1_000_000_000:.2f}",
                    "Revenue ($B)": f"{financial_data.get('revenue', 0) / 1_000_000_000:.2f}",
                    "Profit Margin (%)": f"{financial_data.get('profit_margin', 0):.2f}",
                    "PE Ratio": f"{financial_data.get('pe_ratio', 0):.2f}",
                    "Beta": f"{financial_data.get('beta', 0):.2f}",
                    "ROE (%)": f"{financial_data.get('roe', 0):.2f}",
                    "Debt to Equity": f"{financial_data.get('debt_to_equity', 0):.2f}",
                    "52W High ($)": f"{financial_data.get('week_high_52', 0):.2f}",
                    "52W Low ($)": f"{financial_data.get('week_low_52', 0):.2f}",
                    "Current Price ($)": f"{(financial_data.get('week_high_52', 0) + financial_data.get('week_low_52', 0)) / 2:.2f}",
                    "Financial Health": risk_score.financial_health,
                    "Market Stability": risk_score.market_stability,
                    "Growth Prospects": risk_score.growth_prospects,
                    "Overall Risk": risk_score.overall_risk,
                    "Last Updated": financial_data.get("last_updated", "")
                }
                vendor_data.append(vendor_row)
        
        # Create CSV content
        if not vendor_data:
            raise HTTPException(status_code=404, detail="No vendor data found for export")
        
        # Create CSV string
        output = io.StringIO()
        fieldnames = vendor_data[0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(vendor_data)
        csv_content = output.getvalue()
        output.close()
        
        # Return CSV file
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=windborne_vendors_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@router.get("/export/json")
async def export_vendors_json(db: Session = Depends(get_db)):
    """Export vendor data to JSON format"""
    try:
        # Get all risk scores and vendor data
        risk_scores = db.query(RiskScore).all()
        export_data = {
            "exportDate": datetime.utcnow().isoformat(),
            "totalVendors": len(risk_scores),
            "vendors": []
        }
        
        for risk_score in risk_scores:
            # Get cached vendor data
            cached_data = db.query(VendorCache).filter(
                VendorCache.symbol == risk_score.symbol,
                VendorCache.data_type == "overview"
            ).first()
            
            if cached_data:
                financial_data = json.loads(cached_data.content)
                
                vendor_data = {
                    "symbol": risk_score.symbol,
                    "companyName": financial_data.get("name", ""),
                    "industry": financial_data.get("industry", ""),
                    "vendorType": financial_data.get("vendor_type", ""),
                    "financialMetrics": {
                        "marketCap": financial_data.get("market_cap", 0),
                        "revenue": financial_data.get("revenue", 0),
                        "profitMargin": financial_data.get("profit_margin", 0),
                        "peRatio": financial_data.get("pe_ratio", 0),
                        "beta": financial_data.get("beta", 0),
                        "roe": financial_data.get("roe", 0),
                        "debtToEquity": financial_data.get("debt_to_equity", 0),
                        "weekHigh52": financial_data.get("week_high_52", 0),
                        "weekLow52": financial_data.get("week_low_52", 0),
                        "currentPrice": (financial_data.get("week_high_52", 0) + financial_data.get("week_low_52", 0)) / 2
                    },
                    "riskAnalysis": {
                        "financialHealth": risk_score.financial_health,
                        "marketStability": risk_score.market_stability,
                        "growthProspects": risk_score.growth_prospects,
                        "overallRisk": risk_score.overall_risk
                    },
                    "lastUpdated": financial_data.get("last_updated", "")
                }
                export_data["vendors"].append(vendor_data)
        
        if not export_data["vendors"]:
            raise HTTPException(status_code=404, detail="No vendor data found for export")
        
        # Return JSON file
        return Response(
            content=json.dumps(export_data, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=windborne_vendors_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting JSON: {str(e)}")

@router.get("/export/risk-report")
async def export_risk_report(db: Session = Depends(get_db)):
    """Export detailed risk analysis report"""
    try:
        risk_scores = db.query(RiskScore).all()
        
        if not risk_scores:
            raise HTTPException(status_code=404, detail="No risk data found for report")
        
        # Calculate portfolio-level metrics
        total_vendors = len(risk_scores)
        risk_distribution = {"low": 0, "medium": 0, "high": 0}
        financial_scores = []
        stability_scores = []
        growth_scores = []
        
        vendor_details = []
        
        for risk_score in risk_scores:
            risk_distribution[risk_score.overall_risk] += 1
            financial_scores.append(risk_score.financial_health)
            stability_scores.append(risk_score.market_stability)
            growth_scores.append(risk_score.growth_prospects)
            
            # Get vendor details
            cached_data = db.query(VendorCache).filter(
                VendorCache.symbol == risk_score.symbol,
                VendorCache.data_type == "overview"
            ).first()
            
            if cached_data:
                financial_data = json.loads(cached_data.content)
                vendor_details.append({
                    "symbol": risk_score.symbol,
                    "name": financial_data.get("name", ""),
                    "industry": financial_data.get("industry", ""),
                    "riskLevel": risk_score.overall_risk,
                    "scores": {
                        "financial": risk_score.financial_health,
                        "stability": risk_score.market_stability,
                        "growth": risk_score.growth_prospects
                    }
                })
        
        # Generate report
        report = {
            "reportDate": datetime.utcnow().isoformat(),
            "portfolioSummary": {
                "totalVendors": total_vendors,
                "riskDistribution": {
                    "lowRisk": risk_distribution["low"],
                    "mediumRisk": risk_distribution["medium"],
                    "highRisk": risk_distribution["high"],
                    "lowRiskPercentage": round((risk_distribution["low"] / total_vendors) * 100, 1),
                    "mediumRiskPercentage": round((risk_distribution["medium"] / total_vendors) * 100, 1),
                    "highRiskPercentage": round((risk_distribution["high"] / total_vendors) * 100, 1)
                },
                "averageScores": {
                    "financialHealth": round(sum(financial_scores) / len(financial_scores), 1),
                    "marketStability": round(sum(stability_scores) / len(stability_scores), 1),
                    "growthProspects": round(sum(growth_scores) / len(growth_scores), 1)
                }
            },
            "riskAnalysis": {
                "highRiskVendors": [v for v in vendor_details if v["riskLevel"] == "high"],
                "recommendations": generate_risk_recommendations(risk_distribution, total_vendors),
                "keyFindings": generate_key_findings(risk_distribution, financial_scores, stability_scores, growth_scores)
            },
            "vendorDetails": vendor_details
        }
        
        return Response(
            content=json.dumps(report, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=windborne_risk_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating risk report: {str(e)}")

@router.post("/export/custom")
async def custom_export(
    export_request: dict,
    db: Session = Depends(get_db)
):
    """Custom export with user-specified options"""
    try:
        export_format = export_request.get("format", "csv").lower()
        include_quarterly = export_request.get("includeQuarterly", False)
        include_risk_analysis = export_request.get("includeRiskAnalysis", True)
        vendor_symbols = export_request.get("vendors", [])  # Empty means all
        
        if export_format not in ["csv", "json"]:
            raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv' or 'json'")
        
        # Get vendor data
        query = db.query(VendorCache).filter(VendorCache.data_type == "overview")
        if vendor_symbols:
            query = query.filter(VendorCache.symbol.in_([s.upper() for s in vendor_symbols]))
        
        cached_vendors = query.all()
        
        if not cached_vendors:
            raise HTTPException(status_code=404, detail="No vendor data found for export")
        
        export_data = []
        
        for cached_vendor in cached_vendors:
            financial_data = json.loads(cached_vendor.content)
            
            # Get risk scores
            risk_score = db.query(RiskScore).filter(
                RiskScore.symbol == cached_vendor.symbol
            ).first()
            
            vendor_export = {
                "symbol": cached_vendor.symbol,
                "name": financial_data.get("name", ""),
                "vendorType": financial_data.get("vendor_type", ""),
                "industry": financial_data.get("industry", ""),
                "marketCapBillions": financial_data.get("market_cap", 0) / 1_000_000_000,
                "revenueBillions": financial_data.get("revenue", 0) / 1_000_000_000,
                "profitMarginPercent": financial_data.get("profit_margin", 0),
                "peRatio": financial_data.get("pe_ratio", 0),
                "beta": financial_data.get("beta", 0),
                "roePercent": financial_data.get("roe", 0),
                "debtToEquity": financial_data.get("debt_to_equity", 0),
                "week52High": financial_data.get("week_high_52", 0),
                "week52Low": financial_data.get("week_low_52", 0),
                "lastUpdated": financial_data.get("last_updated", "")
            }
            
            # Add risk analysis if requested
            if include_risk_analysis and risk_score:
                vendor_export.update({
                    "financialHealthScore": risk_score.financial_health,
                    "marketStabilityScore": risk_score.market_stability,
                    "growthProspectsScore": risk_score.growth_prospects,
                    "overallRiskLevel": risk_score.overall_risk,
                    "combinedRiskScore": risk_score.risk_score
                })
            
            # Add quarterly data if requested
            if include_quarterly:
                vendor_export.update({
                    "quarterlyRevenue": financial_data.get("quarterly_revenue", []),
                })
            
            export_data.append(vendor_export)
        
        # Generate response based on format
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if export_format == "csv":
            # Convert to CSV
            from app.utils.csv_export import CSVExporter
            
            # Create a simple CSV from the export data
            output = io.StringIO()
            if export_data:
                fieldnames = export_data[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(export_data)
            
            csv_content = output.getvalue()
            output.close()
            
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=windborne_custom_export_{timestamp}.csv"
                }
            )
        
        else:  # JSON format
            result = {
                "exportDate": datetime.utcnow().isoformat(),
                "exportOptions": export_request,
                "totalVendors": len(export_data),
                "data": export_data
            }
            
            return Response(
                content=json.dumps(result, indent=2),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=windborne_custom_export_{timestamp}.json"
                }
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating custom export: {str(e)}")

def generate_risk_recommendations(risk_distribution: Dict, total_vendors: int) -> List[str]:
    """Generate recommendations based on risk distribution"""
    recommendations = []
    
    high_risk_pct = (risk_distribution["high"] / total_vendors) * 100
    medium_risk_pct = (risk_distribution["medium"] / total_vendors) * 100
    low_risk_pct = (risk_distribution["low"] / total_vendors) * 100
    
    if high_risk_pct > 30:
        recommendations.append("Portfolio has high concentration of risky vendors. Consider reducing exposure or implementing additional monitoring.")
    
    if low_risk_pct < 20:
        recommendations.append("Consider increasing allocation to low-risk vendors to improve portfolio stability.")
    
    if medium_risk_pct > 60:
        recommendations.append("Portfolio is heavily weighted toward medium-risk vendors. Consider balancing with low-risk alternatives.")
    
    return recommendations

def generate_key_findings(risk_distribution: Dict, financial_scores: List, stability_scores: List, growth_scores: List) -> List[str]:
    """Generate key findings from risk analysis"""
    findings = []
    
    avg_financial = sum(financial_scores) / len(financial_scores)
    avg_stability = sum(stability_scores) / len(stability_scores)
    avg_growth = sum(growth_scores) / len(growth_scores)
    
    if avg_financial > 70:
        findings.append("Portfolio demonstrates strong financial health across vendors.")
    elif avg_financial < 50:
        findings.append("Portfolio financial health is below average and requires attention.")
    
    if avg_stability > 70:
        findings.append("Market stability scores indicate a resilient vendor base.")
    elif avg_stability < 50:
        findings.append("Market stability concerns identified across the vendor portfolio.")
    
    if avg_growth > 70:
        findings.append("Strong growth prospects identified across the vendor portfolio.")
    elif avg_growth < 50:
        findings.append("Limited growth prospects may impact long-term vendor performance.")
    
    return findings