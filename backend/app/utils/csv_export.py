import csv
import io
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.vendor import Vendor
from app.models.cache import RiskScore

class CSVExporter:
    """Utility class for generating CSV exports of vendor data"""
    
    @staticmethod
    def export_vendors_csv(vendors: List[Vendor]) -> str:
        """Export vendor data to CSV format"""
        if not vendors:
            return ""
        
        # Define CSV headers
        headers = [
            "Symbol", "Company Name", "Vendor Type", "Industry",
            "Market Cap ($B)", "Revenue ($B)", "Profit Margin (%)", 
            "P/E Ratio", "Beta", "ROE (%)", "Debt to Equity",
            "52W High ($)", "52W Low ($)", "Current Price ($)",
            "Financial Health Score", "Market Stability Score", 
            "Growth Prospects Score", "Overall Risk Level", "Risk Score",
            "Last Updated", "Data Source"
        ]
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(headers)
        
        # Write vendor data
        for vendor in vendors:
            row = [
                vendor.symbol,
                vendor.name,
                vendor.vendor_type,
                vendor.industry,
                f"{vendor.market_cap:.2f}",
                f"{vendor.revenue:.2f}",
                f"{vendor.profit_margin:.2f}",
                f"{vendor.pe_ratio:.2f}",
                f"{vendor.beta:.2f}",
                f"{vendor.roe:.2f}",
                f"{vendor.debt_to_equity:.2f}",
                f"{vendor.week_high_52:.2f}",
                f"{vendor.week_low_52:.2f}",
                f"{vendor.current_price:.2f}",
                vendor.financial_health_score,
                vendor.market_stability_score,
                vendor.growth_prospects_score,
                vendor.overall_risk_level,
                vendor.risk_score,
                vendor.last_updated.strftime("%Y-%m-%d %H:%M:%S") if vendor.last_updated else "",
                vendor.data_source
            ]
            writer.writerow(row)
        
        csv_content = output.getvalue()
        output.close()
        
        return csv_content
    
    @staticmethod
    def export_portfolio_summary_csv(vendors: List[Vendor], kpis: Dict[str, Any]) -> str:
        """Export portfolio summary with KPIs to CSV"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write portfolio summary
        writer.writerow(["=== WINDBORNE VENDOR PORTFOLIO SUMMARY ==="])
        writer.writerow(["Export Date:", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow([])
        
        # Write KPIs
        writer.writerow(["=== KEY PERFORMANCE INDICATORS ==="])
        writer.writerow(["Metric", "Value"])
        for key, value in kpis.items():
            # Format key names for readability
            formatted_key = CSVExporter._format_kpi_name(key)
            writer.writerow([formatted_key, str(value)])
        writer.writerow([])
        
        # Write vendor summary
        writer.writerow(["=== VENDOR SUMMARY ==="])
        summary_headers = ["Symbol", "Company", "Type", "Market Cap", "Risk Level", "Risk Score"]
        writer.writerow(summary_headers)
        
        for vendor in vendors:
            summary_row = [
                vendor.symbol,
                vendor.name,
                vendor.vendor_type,
                f"${vendor.market_cap:.1f}B",
                vendor.overall_risk_level.title(),
                vendor.risk_score
            ]
            writer.writerow(summary_row)
        
        writer.writerow([])
        
        # Write detailed vendor data
        writer.writerow(["=== DETAILED VENDOR DATA ==="])
        detailed_csv = CSVExporter.export_vendors_csv(vendors)
        
        # Append detailed data (skip the header since we're adding our own)
        detailed_lines = detailed_csv.split('\n')
        if len(detailed_lines) > 1:
            for line in detailed_lines:
                if line.strip():
                    writer.writerow(line.split(','))
        
        csv_content = output.getvalue()
        output.close()
        
        return csv_content
    
    @staticmethod
    def export_risk_analysis_csv(db: Session) -> str:
        """Export detailed risk analysis to CSV"""
        risk_scores = db.query(RiskScore).all()
        vendors = db.query(Vendor).filter(Vendor.symbol.in_([rs.symbol for rs in risk_scores])).all()
        
        # Create vendor lookup
        vendor_lookup = {v.symbol: v for v in vendors}
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Risk analysis header
        writer.writerow(["=== WINDBORNE VENDOR RISK ANALYSIS ==="])
        writer.writerow(["Analysis Date:", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow(["Total Vendors Analyzed:", len(risk_scores)])
        writer.writerow([])
        
        # Risk distribution summary
        risk_distribution = {"low": 0, "medium": 0, "high": 0}
        for rs in risk_scores:
            risk_distribution[rs.overall_risk] += 1
        
        writer.writerow(["=== RISK DISTRIBUTION ==="])
        writer.writerow(["Risk Level", "Count", "Percentage"])
        total = len(risk_scores)
        for level, count in risk_distribution.items():
            percentage = (count / total * 100) if total > 0 else 0
            writer.writerow([level.title(), count, f"{percentage:.1f}%"])
        writer.writerow([])
        
        # Average scores
        if risk_scores:
            avg_financial = sum(rs.financial_health for rs in risk_scores) / len(risk_scores)
            avg_stability = sum(rs.market_stability for rs in risk_scores) / len(risk_scores)
            avg_growth = sum(rs.growth_prospects for rs in risk_scores) / len(risk_scores)
            
            writer.writerow(["=== AVERAGE RISK SCORES ==="])
            writer.writerow(["Metric", "Average Score (0-100)"])
            writer.writerow(["Financial Health", f"{avg_financial:.1f}"])
            writer.writerow(["Market Stability", f"{avg_stability:.1f}"])
            writer.writerow(["Growth Prospects", f"{avg_growth:.1f}"])
            writer.writerow([])
        
        # Detailed risk scores
        writer.writerow(["=== DETAILED RISK ANALYSIS ==="])
        headers = [
            "Symbol", "Company Name", "Vendor Type", "Market Cap ($B)",
            "Financial Health", "Market Stability", "Growth Prospects", 
            "Overall Risk", "Combined Score", "Last Updated"
        ]
        writer.writerow(headers)
        
        for risk_score in risk_scores:
            vendor = vendor_lookup.get(risk_score.symbol)
            if vendor:
                row = [
                    risk_score.symbol,
                    vendor.name,
                    vendor.vendor_type,
                    f"{vendor.market_cap:.2f}",
                    risk_score.financial_health,
                    risk_score.market_stability,
                    risk_score.growth_prospects,
                    risk_score.overall_risk.title(),
                    risk_score.risk_score,
                    risk_score.updated_at.strftime("%Y-%m-%d %H:%M:%S") if risk_score.updated_at else ""
                ]
                writer.writerow(row)
        
        csv_content = output.getvalue()
        output.close()
        
        return csv_content
    
    @staticmethod
    def export_quarterly_trends_csv(vendors: List[Vendor]) -> str:
        """Export quarterly revenue and income trends to CSV"""
        import json
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["=== QUARTERLY TRENDS ANALYSIS ==="])
        writer.writerow(["Export Date:", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow([])
        
        # Revenue trends
        writer.writerow(["=== QUARTERLY REVENUE TRENDS ($B) ==="])
        revenue_headers = ["Symbol", "Company", "Q1", "Q2", "Q3", "Q4", "Trend"]
        writer.writerow(revenue_headers)
        
        for vendor in vendors:
            quarterly_rev = []
            try:
                if vendor.quarterly_revenue:
                    quarterly_rev = json.loads(vendor.quarterly_revenue)
            except json.JSONDecodeError:
                pass
            
            # Pad with zeros if less than 4 quarters
            while len(quarterly_rev) < 4:
                quarterly_rev.append(0.0)
            
            # Calculate trend (simple comparison of latest vs oldest)
            trend = "→"  # flat
            if len([q for q in quarterly_rev if q > 0]) >= 2:
                if quarterly_rev[0] > quarterly_rev[-1]:
                    trend = "↗"  # up
                elif quarterly_rev[0] < quarterly_rev[-1]:
                    trend = "↘"  # down
            
            row = [
                vendor.symbol,
                vendor.name,
                f"{quarterly_rev[0]:.2f}",
                f"{quarterly_rev[1]:.2f}",
                f"{quarterly_rev[2]:.2f}",
                f"{quarterly_rev[3]:.2f}",
                trend
            ]
            writer.writerow(row)
        
        writer.writerow([])
        
        # Income trends
        writer.writerow(["=== QUARTERLY NET INCOME TRENDS ($B) ==="])
        income_headers = ["Symbol", "Company", "Q1", "Q2", "Q3", "Q4", "Trend"]
        writer.writerow(income_headers)
        
        for vendor in vendors:
            quarterly_inc = []
            try:
                if vendor.quarterly_income:
                    quarterly_inc = json.loads(vendor.quarterly_income)
            except json.JSONDecodeError:
                pass
            
            # Pad with zeros if less than 4 quarters
            while len(quarterly_inc) < 4:
                quarterly_inc.append(0.0)
            
            # Calculate trend
            trend = "→"
            if len([q for q in quarterly_inc if q != 0]) >= 2:
                if quarterly_inc[0] > quarterly_inc[-1]:
                    trend = "↗"
                elif quarterly_inc[0] < quarterly_inc[-1]:
                    trend = "↘"
            
            row = [
                vendor.symbol,
                vendor.name,
                f"{quarterly_inc[0]:.2f}",
                f"{quarterly_inc[1]:.2f}",
                f"{quarterly_inc[2]:.2f}",
                f"{quarterly_inc[3]:.2f}",
                trend
            ]
            writer.writerow(row)
        
        csv_content = output.getvalue()
        output.close()
        
        return csv_content
    
    @staticmethod
    def _format_kpi_name(key: str) -> str:
        """Format KPI key names for CSV display"""
        formatting_map = {
            "totalVendors": "Total Vendors",
            "totalPortfolioValue": "Total Portfolio Value",
            "avgProfitMargin": "Average Profit Margin",
            "sensorVsMaterials": "Sensor vs Materials Split",
            "lowRiskCount": "Low Risk Vendors",
            "mediumRiskCount": "Medium Risk Vendors", 
            "highRiskCount": "High Risk Vendors",
            "bestPerformer": "Best Performing Vendor",
            "avgRiskScore": "Average Risk Score"
        }
        
        return formatting_map.get(key, key.replace("_", " ").title())
    
    @staticmethod
    def generate_filename(export_type: str = "vendors") -> str:
        """Generate timestamped filename for CSV export"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"windborne_{export_type}_{timestamp}.csv"