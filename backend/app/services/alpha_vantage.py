import requests
import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

class AlphaVantageService:
    def __init__(self):
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.base_url = "https://www.alphavantage.co/query"
        self.last_call_time = 0
        self.call_delay = 12  # 5 calls per minute = 12 seconds between calls
        
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY environment variable is required")

    def _rate_limit(self):
        """Implement rate limiting to respect API limits"""
        current_time = time.time()
        time_since_last_call = current_time - self.last_call_time
        
        if time_since_last_call < self.call_delay:
            sleep_time = self.call_delay - time_since_last_call
            time.sleep(sleep_time)
        
        self.last_call_time = time.time()

    def get_company_overview(self, symbol: str) -> Optional[Dict]:
        """Get company overview data from Alpha Vantage"""
        self._rate_limit()
        
        params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for API error responses
            if "Error Message" in data:
                logger.error(f"Alpha Vantage API error for {symbol}: {data['Error Message']}")
                return None
            
            if "Note" in data:
                logger.error(f"Alpha Vantage API limit for {symbol}: {data['Note']}")
                return None
                
            if "Information" in data and "rate limit" in data["Information"].lower():
                logger.error(f"Alpha Vantage API rate limit for {symbol}: {data['Information']}")
                return None
                
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {symbol}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {symbol}: {e}")
            return None

    def get_income_statement(self, symbol: str) -> Optional[Dict]:
        """Get income statement data from Alpha Vantage"""
        self._rate_limit()
        
        params = {
            "function": "INCOME_STATEMENT",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for API error responses
            if "Error Message" in data:
                logger.error(f"Alpha Vantage API error for {symbol}: {data['Error Message']}")
                return None
            
            if "Note" in data:
                logger.error(f"Alpha Vantage API limit for {symbol}: {data['Note']}")
                return None
                
            if "Information" in data and "rate limit" in data["Information"].lower():
                logger.error(f"Alpha Vantage API rate limit for {symbol}: {data['Information']}")
                return None
                
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {symbol}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {symbol}: {e}")
            return None

    def get_balance_sheet(self, symbol: str) -> Optional[Dict]:
        """Get balance sheet data from Alpha Vantage"""
        self._rate_limit()
        
        params = {
            "function": "BALANCE_SHEET",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for API error responses
            if "Error Message" in data:
                logger.error(f"Alpha Vantage API error for {symbol}: {data['Error Message']}")
                return None
            
            if "Note" in data:
                logger.error(f"Alpha Vantage API limit for {symbol}: {data['Note']}")
                return None
                
            if "Information" in data and "rate limit" in data["Information"].lower():
                logger.error(f"Alpha Vantage API rate limit for {symbol}: {data['Information']}")
                return None
                
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {symbol}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {symbol}: {e}")
            return None

    def parse_financial_data(self, overview: Dict, income_statement: Optional[Dict] = None, balance_sheet: Optional[Dict] = None) -> Dict:
        """Parse and normalize financial data from Alpha Vantage response"""
        try:
            # Extract basic company info
            parsed_data = {
                "symbol": overview.get("Symbol", ""),
                "name": overview.get("Name", ""),
                "industry": self._map_industry(overview.get("Sector", "")),
                "vendor_type": self._determine_vendor_type(overview.get("Sector", ""), overview.get("Industry", "")),
                "market_cap": self._parse_number(overview.get("MarketCapitalization", "0")),
                "pe_ratio": self._parse_number(overview.get("PERatio", "0")),
                "profit_margin": self._parse_percentage(overview.get("ProfitMargin", "0")),
                "revenue": self._parse_number(overview.get("RevenueTTM", "0")),
                "week_high_52": self._parse_number(overview.get("52WeekHigh", "0")),
                "week_low_52": self._parse_number(overview.get("52WeekLow", "0")),
                "beta": self._parse_number(overview.get("Beta", "0")),
                "roe": self._parse_percentage(overview.get("ReturnOnEquityTTM", "0")),
                "debt_to_equity": self._parse_number(overview.get("DebtToEquityRatio", "0")),
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # Add quarterly data if income statement is available
            if income_statement:
                quarterly_reports = income_statement.get("quarterlyReports", [])[:4]
                parsed_data["quarterly_revenue"] = [
                    self._parse_number(report.get("totalRevenue", "0")) / 1_000_000_000  # Convert to billions
                    for report in quarterly_reports
                ]
            else:
                # Default quarterly data based on TTM revenue
                ttm_revenue = parsed_data["revenue"]
                parsed_data["quarterly_revenue"] = [ttm_revenue * 0.25] * 4
            
            # Add balance sheet data if available
            if balance_sheet:
                balance_sheet_data = self._parse_balance_sheet(balance_sheet)
                parsed_data["balance_sheet"] = balance_sheet_data
                parsed_data["financial_ratios"] = self._calculate_financial_ratios(parsed_data, balance_sheet_data)
            else:
                parsed_data["balance_sheet"] = None
                parsed_data["financial_ratios"] = {}
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing financial data: {e}")
            return {}

    def _parse_number(self, value: str) -> float:
        """Parse string number to float, handling various formats"""
        if not value or value == "None":
            return 0.0
        
        try:
            # Remove any non-numeric characters except decimal point and minus
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

    def _map_industry(self, sector: str) -> str:
        """Map Alpha Vantage sector to our industry categories"""
        sector_lower = sector.lower()
        if "technology" in sector_lower or "electronic" in sector_lower:
            return "Sensors"
        elif "materials" in sector_lower or "chemical" in sector_lower:
            return "Plastics"
        else:
            return "Other"

    def _determine_vendor_type(self, sector: str, industry: str) -> str:
        """Determine vendor type based on sector and industry"""
        combined = f"{sector} {industry}".lower()
        if "technology" in combined or "electronic" in combined or "sensor" in combined:
            return "Sensor Supplier"
        elif "materials" in combined or "chemical" in combined or "plastic" in combined:
            return "Materials Supplier"
        else:
            return "Other Supplier"

    def _parse_balance_sheet(self, balance_sheet: Dict) -> Dict:
        """Parse balance sheet data from Alpha Vantage response"""
        try:
            annual_reports = balance_sheet.get("annualReports", [])
            if not annual_reports:
                return {}
            
            # Get the most recent annual report
            latest_report = annual_reports[0]
            
            return {
                "total_assets": self._parse_number(latest_report.get("totalAssets", "0")),
                "total_liabilities": self._parse_number(latest_report.get("totalLiabilities", "0")),
                "total_shareholder_equity": self._parse_number(latest_report.get("totalShareholderEquity", "0")),
                "cash_and_cash_equivalents": self._parse_number(latest_report.get("cashAndCashEquivalents", "0")),
                "short_term_debt": self._parse_number(latest_report.get("shortTermDebt", "0")),
                "long_term_debt": self._parse_number(latest_report.get("longTermDebt", "0")),
                "total_current_assets": self._parse_number(latest_report.get("totalCurrentAssets", "0")),
                "total_current_liabilities": self._parse_number(latest_report.get("totalCurrentLiabilities", "0")),
                "fiscal_date_ending": latest_report.get("fiscalDateEnding", "")
            }
        except Exception as e:
            logger.error(f"Error parsing balance sheet data: {e}")
            return {}

    def _calculate_financial_ratios(self, financial_data: Dict, balance_sheet_data: Dict) -> Dict:
        """Calculate comprehensive financial ratios from financial data"""
        try:
            if not balance_sheet_data:
                return {}
            
            ratios = {}
            
            # Debt ratios
            if balance_sheet_data.get("total_shareholder_equity", 0) > 0:
                ratios["debt_to_equity"] = balance_sheet_data["total_liabilities"] / balance_sheet_data["total_shareholder_equity"]
                
                # Alternative debt-to-equity using total debt
                total_debt = balance_sheet_data.get("short_term_debt", 0) + balance_sheet_data.get("long_term_debt", 0)
                if total_debt > 0:
                    ratios["total_debt_to_equity"] = total_debt / balance_sheet_data["total_shareholder_equity"]
            
            # Liquidity ratios
            if balance_sheet_data.get("total_current_liabilities", 0) > 0:
                ratios["current_ratio"] = balance_sheet_data["total_current_assets"] / balance_sheet_data["total_current_liabilities"]
                
                # Quick ratio (assuming cash equivalents are liquid)
                liquid_assets = balance_sheet_data.get("cash_and_cash_equivalents", 0)
                ratios["quick_ratio"] = liquid_assets / balance_sheet_data["total_current_liabilities"]
            
            # Asset efficiency
            if balance_sheet_data.get("total_assets", 0) > 0:
                ratios["cash_ratio"] = balance_sheet_data.get("cash_and_cash_equivalents", 0) / balance_sheet_data["total_assets"]
                
                # Asset turnover (requires revenue)
                revenue = financial_data.get("revenue", 0) * 1_000_000_000  # Convert back from billions
                if revenue > 0:
                    ratios["asset_turnover"] = revenue / balance_sheet_data["total_assets"]
            
            # Working capital
            ratios["working_capital"] = balance_sheet_data.get("total_current_assets", 0) - balance_sheet_data.get("total_current_liabilities", 0)
            
            # Equity ratio
            if balance_sheet_data.get("total_assets", 0) > 0:
                ratios["equity_ratio"] = balance_sheet_data.get("total_shareholder_equity", 0) / balance_sheet_data["total_assets"]
            
            return ratios
            
        except Exception as e:
            logger.error(f"Error calculating financial ratios: {e}")
            return {}

