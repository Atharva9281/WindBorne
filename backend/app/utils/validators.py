import re
from typing import Optional, List, Dict

class DataValidator:
    """Validates data inputs and formats for the application"""
    
    @staticmethod
    def validate_stock_symbol(symbol: str) -> bool:
        """Validate if a stock symbol has correct format"""
        if not symbol or not isinstance(symbol, str):
            return False
        
        # Stock symbols are typically 1-5 characters, letters only
        pattern = r'^[A-Z]{1,5}$'
        return bool(re.match(pattern, symbol.upper()))
    
    @staticmethod
    def validate_financial_data(data: Dict) -> List[str]:
        """Validate financial data and return list of validation errors"""
        errors = []
        
        required_fields = ["symbol", "name", "market_cap", "revenue"]
        for field in required_fields:
            if field not in data or data[field] is None:
                errors.append(f"Missing required field: {field}")
        
        # Validate numeric fields
        numeric_fields = {
            "market_cap": "Market Cap",
            "revenue": "Revenue", 
            "profit_margin": "Profit Margin",
            "pe_ratio": "PE Ratio",
            "beta": "Beta",
            "roe": "ROE",
            "debt_to_equity": "Debt to Equity"
        }
        
        for field, display_name in numeric_fields.items():
            if field in data:
                if not DataValidator._is_valid_number(data[field]):
                    errors.append(f"Invalid {display_name}: must be a number")
                elif field == "profit_margin" and data[field] < -100:
                    errors.append(f"{display_name} cannot be less than -100%")
                elif field == "pe_ratio" and data[field] < 0:
                    errors.append(f"{display_name} cannot be negative")
                elif field in ["market_cap", "revenue"] and data[field] < 0:
                    errors.append(f"{display_name} cannot be negative")
        
        return errors
    
    @staticmethod
    def validate_risk_scores(financial_health: int, market_stability: int, 
                           growth_prospects: int, overall_risk: str) -> List[str]:
        """Validate risk score inputs"""
        errors = []
        
        # Validate score ranges (0-100)
        scores = {
            "Financial Health": financial_health,
            "Market Stability": market_stability,
            "Growth Prospects": growth_prospects
        }
        
        for name, score in scores.items():
            if not isinstance(score, int) or score < 0 or score > 100:
                errors.append(f"{name} must be an integer between 0 and 100")
        
        # Validate overall risk
        valid_risk_levels = ["low", "medium", "high"]
        if overall_risk not in valid_risk_levels:
            errors.append(f"Overall risk must be one of: {', '.join(valid_risk_levels)}")
        
        return errors
    
    @staticmethod
    def validate_export_format(format_type: str) -> bool:
        """Validate export format type"""
        valid_formats = ["csv", "json", "pdf"]
        return format_type.lower() in valid_formats
    
    @staticmethod
    def clean_financial_data(data: Dict) -> Dict:
        """Clean and normalize financial data"""
        cleaned = {}
        
        for key, value in data.items():
            if key in ["symbol", "name", "industry", "vendor_type"]:
                # String fields
                cleaned[key] = str(value).strip() if value else ""
            elif key in ["market_cap", "revenue", "profit_margin", "pe_ratio", 
                        "beta", "roe", "debt_to_equity", "week_high_52", "week_low_52"]:
                # Numeric fields
                cleaned[key] = DataValidator._clean_numeric_value(value)
            else:
                cleaned[key] = value
        
        return cleaned
    
    @staticmethod
    def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> List[str]:
        """Validate date range inputs"""
        errors = []
        
        if start_date and not DataValidator._is_valid_date_format(start_date):
            errors.append("Invalid start date format. Use YYYY-MM-DD")
        
        if end_date and not DataValidator._is_valid_date_format(end_date):
            errors.append("Invalid end date format. Use YYYY-MM-DD")
        
        if start_date and end_date:
            if start_date > end_date:
                errors.append("Start date cannot be after end date")
        
        return errors
    
    @staticmethod
    def _is_valid_number(value) -> bool:
        """Check if value is a valid number"""
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _clean_numeric_value(value) -> float:
        """Clean and convert value to float"""
        if value is None:
            return 0.0
        
        try:
            # Handle string values that might have formatting
            if isinstance(value, str):
                # Remove common formatting characters
                cleaned = value.replace(',', '').replace('$', '').replace('%', '')
                return float(cleaned)
            
            return float(value)
        except (ValueError, TypeError):
            return 0.0
    
    @staticmethod
    def _is_valid_date_format(date_string: str) -> bool:
        """Check if date string is in YYYY-MM-DD format"""
        pattern = r'^\d{4}-\d{2}-\d{2}$'
        return bool(re.match(pattern, date_string))
    
    @staticmethod
    def validate_alpha_vantage_response(response: Dict) -> List[str]:
        """Validate Alpha Vantage API response"""
        errors = []
        
        if not response:
            errors.append("Empty response from Alpha Vantage API")
            return errors
        
        if "Error Message" in response:
            errors.append(f"API Error: {response['Error Message']}")
        
        if "Note" in response:
            errors.append(f"API Limit: {response['Note']}")
        
        # Check for required fields in overview response
        if "Symbol" not in response and "Error Message" not in response:
            errors.append("Response missing Symbol field")
        
        return errors