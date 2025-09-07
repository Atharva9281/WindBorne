from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

class Vendor(Base):
    """Vendor data model for WindBorne dashboard"""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    vendor_type = Column(String(100), nullable=False)  # 'Sensor Supplier' or 'Materials Supplier'
    industry = Column(String(100))
    
    # Financial Metrics
    market_cap = Column(Float, default=0.0)  # in billions
    revenue = Column(Float, default=0.0)     # in billions
    profit_margin = Column(Float, default=0.0)  # percentage
    pe_ratio = Column(Float, default=0.0)
    beta = Column(Float, default=0.0)
    roe = Column(Float, default=0.0)         # Return on Equity percentage
    debt_to_equity = Column(Float, default=0.0)
    
    # Price Data
    current_price = Column(Float, default=0.0)
    week_high_52 = Column(Float, default=0.0)
    week_low_52 = Column(Float, default=0.0)
    
    # Risk Assessment
    financial_health_score = Column(Integer, default=0)    # 0-100
    market_stability_score = Column(Integer, default=0)    # 0-100
    growth_prospects_score = Column(Integer, default=0)    # 0-100
    overall_risk_level = Column(String(20), default="medium")  # 'low', 'medium', 'high'
    risk_score = Column(Integer, default=0)  # Combined risk score 0-100
    
    # Quarterly Data (JSON stored as text)
    quarterly_revenue = Column(Text)  # JSON array of quarterly revenue
    quarterly_income = Column(Text)   # JSON array of quarterly net income
    
    # Metadata
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    data_source = Column(String(50), default="alpha_vantage")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert vendor model to dictionary for API responses"""
        import json
        
        quarterly_rev = []
        quarterly_inc = []
        
        try:
            if self.quarterly_revenue:
                quarterly_rev = json.loads(self.quarterly_revenue)
        except json.JSONDecodeError:
            pass
            
        try:
            if self.quarterly_income:
                quarterly_inc = json.loads(self.quarterly_income)
        except json.JSONDecodeError:
            pass
        
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "vendorType": self.vendor_type,
            "industry": self.industry,
            "marketCap": f"${self.market_cap:.1f}B" if self.market_cap else "$0.0B",
            "revenue": f"${self.revenue:.1f}B" if self.revenue else "$0.0B",
            "profitMargin": f"{self.profit_margin:.1f}%" if self.profit_margin else "0.0%",
            "peRatio": self.pe_ratio,
            "beta": self.beta,
            "roe": f"{self.roe:.1f}%" if self.roe else "0.0%",
            "debtToEquity": self.debt_to_equity,
            "currentPrice": f"${self.current_price:.2f}" if self.current_price else "$0.00",
            "weekHigh52": self.week_high_52,
            "weekLow52": self.week_low_52,
            "riskLevel": self.overall_risk_level,
            "riskScore": self.risk_score,
            "financialHealth": self.financial_health_score,
            "marketStability": self.market_stability_score,
            "growthProspects": self.growth_prospects_score,
            "quarterlyRevenue": quarterly_rev,
            "quarterlyIncome": quarterly_inc,
            "lastUpdated": self.last_updated.isoformat() if self.last_updated else None,
            "isActive": self.is_active
        }
    
    def update_from_alpha_vantage(self, overview_data: Dict, income_data: Optional[Dict] = None):
        """Update vendor data from Alpha Vantage API response"""
        if not overview_data:
            return
        
        # Basic company info
        self.name = overview_data.get("Name", self.name)
        self.industry = self._map_sector_to_industry(overview_data.get("Sector", ""))
        self.vendor_type = self._determine_vendor_type(overview_data.get("Sector", ""))
        
        # Financial metrics
        self.market_cap = self._parse_financial_value(overview_data.get("MarketCapitalization", "0")) / 1_000_000_000
        self.revenue = self._parse_financial_value(overview_data.get("RevenueTTM", "0")) / 1_000_000_000
        self.profit_margin = self._parse_percentage(overview_data.get("ProfitMargin", "0"))
        self.pe_ratio = self._parse_float(overview_data.get("PERatio", "0"))
        self.beta = self._parse_float(overview_data.get("Beta", "0"))
        self.roe = self._parse_percentage(overview_data.get("ReturnOnEquityTTM", "0"))
        self.debt_to_equity = self._parse_float(overview_data.get("DebtToEquityRatio", "0"))
        
        # Price data
        self.week_high_52 = self._parse_float(overview_data.get("52WeekHigh", "0"))
        self.week_low_52 = self._parse_float(overview_data.get("52WeekLow", "0"))
        self.current_price = (self.week_high_52 + self.week_low_52) / 2 if self.week_high_52 and self.week_low_52 else 0
        
        # Update quarterly data if income statement is provided
        if income_data:
            self._update_quarterly_data(income_data)
        
        self.last_updated = datetime.utcnow()
    
    def _map_sector_to_industry(self, sector: str) -> str:
        """Map Alpha Vantage sector to our industry categories"""
        sector_lower = sector.lower()
        if "technology" in sector_lower or "electronic" in sector_lower:
            return "Sensors"
        elif "materials" in sector_lower or "chemical" in sector_lower:
            return "Materials"
        else:
            return "Other"
    
    def _determine_vendor_type(self, sector: str) -> str:
        """Determine vendor type based on sector"""
        sector_lower = sector.lower()
        if "technology" in sector_lower or "electronic" in sector_lower:
            return "Sensor Supplier"
        elif "materials" in sector_lower or "chemical" in sector_lower:
            return "Materials Supplier"
        else:
            return "Other Supplier"
    
    def _parse_financial_value(self, value: str) -> float:
        """Parse financial value string to float"""
        if not value or value == "None":
            return 0.0
        try:
            cleaned = ''.join(c for c in str(value) if c.isdigit() or c in '.-')
            return float(cleaned) if cleaned and cleaned != '-' else 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def _parse_percentage(self, value: str) -> float:
        """Parse percentage string to float"""
        if not value or value == "None":
            return 0.0
        try:
            cleaned = str(value).replace('%', '')
            return float(cleaned) * 100 if cleaned else 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def _parse_float(self, value: str) -> float:
        """Parse string to float"""
        try:
            return float(value) if value and value != "None" else 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def _update_quarterly_data(self, income_data: Dict):
        """Update quarterly revenue and income data"""
        import json
        
        quarterly_reports = income_data.get("quarterlyReports", [])[:4]  # Last 4 quarters
        
        revenue_data = []
        income_data_list = []
        
        for report in quarterly_reports:
            revenue = self._parse_financial_value(report.get("totalRevenue", "0")) / 1_000_000_000
            income = self._parse_financial_value(report.get("netIncome", "0")) / 1_000_000_000
            
            revenue_data.append(revenue)
            income_data_list.append(income)
        
        self.quarterly_revenue = json.dumps(revenue_data)
        self.quarterly_income = json.dumps(income_data_list)

    @classmethod
    def get_windborne_vendors(cls):
        """Get the list of WindBorne tracked vendors"""
        return [
            {"symbol": "TEL", "name": "TE Connectivity", "type": "Sensor Supplier"},
            {"symbol": "ST", "name": "Sensata Technologies", "type": "Sensor Supplier"}, 
            {"symbol": "DD", "name": "DuPont de Nemours", "type": "Materials Supplier"},
            {"symbol": "CE", "name": "Celanese Corporation", "type": "Materials Supplier"},
            {"symbol": "LYB", "name": "LyondellBasell Industries", "type": "Materials Supplier"}
        ]