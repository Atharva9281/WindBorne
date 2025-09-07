from typing import Dict, Tuple
import math

class RiskCalculator:
    """Calculate risk scores for vendors based on financial metrics"""
    
    @staticmethod
    def calculate_risk_score(financial_data: Dict) -> Dict[str, any]:
        """
        Calculate risk scores and overall risk level with 4-component system
        Returns: Dict with financial_health, market_stability, growth_prospects, financial_stability, risk_score, overall_risk
        """
        try:
            # Validate input data
            if not financial_data or not isinstance(financial_data, dict):
                return RiskCalculator._get_default_risk_scores()
            
            # Financial Health Score (0-100) - Profitability metrics
            financial_health = RiskCalculator._calculate_financial_health(financial_data)
            
            # Market Stability Score (0-100) - Market volatility and size
            market_stability = RiskCalculator._calculate_market_stability(financial_data)
            
            # Growth Prospects Score (0-100) - Revenue growth and industry trends
            growth_prospects = RiskCalculator._calculate_growth_prospects(financial_data)
            
            # Financial Stability Score (0-100) - Balance sheet strength
            financial_stability = RiskCalculator._calculate_financial_stability(financial_data)
            
            # Ensure all scores are valid integers
            financial_health = max(0, min(100, int(financial_health or 0)))
            market_stability = max(0, min(100, int(market_stability or 0)))
            growth_prospects = max(0, min(100, int(growth_prospects or 0)))
            financial_stability = max(0, min(100, int(financial_stability or 0)))
            
            # Calculate weighted average for overall risk score (4-component system)
            risk_score = int((financial_health * 0.25 + market_stability * 0.25 + 
                            growth_prospects * 0.25 + financial_stability * 0.25))
            risk_score = max(0, min(100, risk_score))  # Ensure 0-100 range
            
            # Overall Risk Level based on combined score
            overall_risk = RiskCalculator._determine_risk_level(risk_score)
            
            return {
                "financial_health": financial_health,
                "market_stability": market_stability,
                "growth_prospects": growth_prospects,
                "financial_stability": financial_stability,
                "risk_score": risk_score,
                "overall_risk": overall_risk
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in risk calculation: {e}", exc_info=True)
            return RiskCalculator._get_default_risk_scores()
    
    @staticmethod
    def _get_default_risk_scores() -> Dict[str, any]:
        """Return default risk scores when calculation fails"""
        return {
            "financial_health": 50,
            "market_stability": 50, 
            "growth_prospects": 50,
            "financial_stability": 50,
            "risk_score": 50,
            "overall_risk": "medium"
        }
    
    @staticmethod
    def _calculate_financial_health(data: Dict) -> int:
        """Calculate financial health score based on profitability and debt"""
        score = 50  # Base score
        
        # Profit margin impact (0-30 points)
        profit_margin = data.get("profit_margin", 0)
        if profit_margin > 15:
            score += 30
        elif profit_margin > 10:
            score += 20
        elif profit_margin > 5:
            score += 10
        elif profit_margin < -10:
            score -= 40
        elif profit_margin < -5:
            score -= 30
        elif profit_margin < 0:
            score -= 25
        
        # PE Ratio impact (0-20 points)
        pe_ratio = data.get("pe_ratio", 0)
        if 10 <= pe_ratio <= 25:  # Reasonable PE range
            score += 20
        elif 5 <= pe_ratio < 10 or 25 < pe_ratio <= 35:
            score += 10
        elif pe_ratio > 50:  # Very high PE
            score -= 10
        elif pe_ratio == 0:  # Missing or invalid PE data
            score -= 15
        
        # ROE impact (0-20 points)
        roe = data.get("roe", 0)
        if roe > 20:
            score += 20
        elif roe > 15:
            score += 15
        elif roe > 10:
            score += 10
        elif roe < 0:
            score -= 15
        
        # Debt to Equity impact (-20 to +10 points)
        debt_to_equity = data.get("debt_to_equity", 0)
        if debt_to_equity < 0.3:
            score += 10
        elif debt_to_equity < 0.6:
            score += 5
        elif debt_to_equity > 1.5:
            score -= 20
        elif debt_to_equity > 1.0:
            score -= 10
        
        return max(0, min(100, score))
    
    @staticmethod
    def _calculate_market_stability(data: Dict) -> int:
        """Calculate market stability score based on volatility and market cap"""
        score = 50  # Base score
        
        # Market Cap impact (0-25 points) - larger companies are generally more stable
        market_cap = data.get("market_cap", 0) / 1_000_000_000  # Convert to billions
        if market_cap > 50:
            score += 25
        elif market_cap > 20:
            score += 20
        elif market_cap > 10:
            score += 15
        elif market_cap > 5:
            score += 10
        elif market_cap < 1:
            score -= 10
        
        # Beta impact (-25 to +25 points) - lower beta = more stable
        beta = data.get("beta", 1.0)
        if beta < 0.5:
            score += 25
        elif beta < 0.8:
            score += 15
        elif beta < 1.2:
            score += 5
        elif beta < 1.5:
            score -= 5
        elif beta < 2.0:
            score -= 15
        else:
            score -= 25
        
        # 52-week range volatility (-20 to +20 points)
        week_high = data.get("week_high_52", 0)
        week_low = data.get("week_low_52", 0)
        if week_high > 0 and week_low > 0:
            volatility = (week_high - week_low) / week_low
            if volatility < 0.2:  # Low volatility
                score += 20
            elif volatility < 0.4:
                score += 10
            elif volatility > 1.0:  # High volatility
                score -= 20
            elif volatility > 0.6:
                score -= 10
        
        return max(0, min(100, score))
    
    @staticmethod
    def _calculate_growth_prospects(data: Dict) -> int:
        """Calculate growth prospects score based on revenue trends and industry"""
        score = 50  # Base score
        
        # Revenue growth from quarterly data (0-30 points)
        quarterly_revenue = data.get("quarterly_revenue", [])
        if len(quarterly_revenue) >= 2:
            # Compare latest quarter to previous
            if quarterly_revenue[0] > quarterly_revenue[1]:
                growth_rate = (quarterly_revenue[0] - quarterly_revenue[1]) / quarterly_revenue[1]
                if growth_rate > 0.1:  # >10% growth
                    score += 30
                elif growth_rate > 0.05:  # 5-10% growth
                    score += 20
                elif growth_rate > 0:  # Any positive growth
                    score += 10
            else:
                # Negative growth
                decline_rate = (quarterly_revenue[1] - quarterly_revenue[0]) / quarterly_revenue[1]
                if decline_rate > 0.1:  # >10% decline
                    score -= 20
                elif decline_rate > 0.05:  # 5-10% decline
                    score -= 10
        
        # Industry prospects (0-20 points)
        industry = data.get("industry", "")
        vendor_type = data.get("vendor_type", "")
        if "Sensor" in vendor_type or "technology" in industry.lower():
            score += 20  # Tech/sensors have good growth prospects
        elif "Materials" in vendor_type:
            score += 10  # Materials have moderate prospects
        
        # PE Ratio as growth indicator (0-20 points)
        pe_ratio = data.get("pe_ratio", 0)
        if 15 <= pe_ratio <= 30:  # Moderate growth expectations
            score += 20
        elif 30 < pe_ratio <= 50:  # High growth expectations
            score += 15
        elif pe_ratio > 50:  # Unrealistic expectations
            score -= 10
        
        return max(0, min(100, score))
    
    @staticmethod
    def _calculate_financial_stability(data: Dict) -> int:
        """Calculate financial stability score based on balance sheet strength"""
        score = 50  # Base score
        
        # Get balance sheet data
        balance_sheet = data.get("balance_sheet", {})
        financial_ratios = data.get("financial_ratios", {})
        
        if not balance_sheet:
            return score  # Return base score if no balance sheet data
        
        # Debt-to-equity ratio (0-25 points)
        debt_equity = financial_ratios.get("debt_to_equity", 0)
        if debt_equity < 0.3:
            score += 25
        elif debt_equity < 0.6:
            score += 15
        elif debt_equity < 1.0:
            score += 5
        elif debt_equity > 2.0:
            score -= 25
        elif debt_equity > 1.5:
            score -= 15
        
        # Current ratio - liquidity (0-20 points)
        current_ratio = financial_ratios.get("current_ratio", 0)
        if current_ratio > 2.0:
            score += 20
        elif current_ratio > 1.5:
            score += 15
        elif current_ratio > 1.2:
            score += 10
        elif current_ratio < 1.0:
            score -= 20
        elif current_ratio < 1.1:
            score -= 10
        
        # Cash ratio - liquidity strength (0-15 points)
        cash_ratio = financial_ratios.get("cash_ratio", 0)
        if cash_ratio > 0.20:
            score += 15
        elif cash_ratio > 0.15:
            score += 12
        elif cash_ratio > 0.10:
            score += 8
        elif cash_ratio > 0.05:
            score += 5
        elif cash_ratio < 0.02:
            score -= 10
        
        # Working capital (0-15 points)
        working_capital = financial_ratios.get("working_capital", 0)
        total_assets = balance_sheet.get("total_assets", 1)  # Avoid division by zero
        if total_assets > 0:
            wc_ratio = working_capital / total_assets
            if wc_ratio > 0.20:
                score += 15
            elif wc_ratio > 0.10:
                score += 10
            elif wc_ratio > 0.05:
                score += 5
            elif wc_ratio < -0.05:  # Negative working capital
                score -= 15
            elif wc_ratio < 0:
                score -= 8
        
        # Equity ratio - capital structure (0-15 points)
        equity_ratio = financial_ratios.get("equity_ratio", 0)
        if equity_ratio > 0.60:
            score += 15
        elif equity_ratio > 0.50:
            score += 12
        elif equity_ratio > 0.40:
            score += 8
        elif equity_ratio > 0.30:
            score += 5
        elif equity_ratio < 0.20:
            score -= 15
        elif equity_ratio < 0.25:
            score -= 8
        
        # Asset turnover efficiency (0-10 points)
        asset_turnover = financial_ratios.get("asset_turnover", 0)
        if asset_turnover > 1.5:
            score += 10
        elif asset_turnover > 1.0:
            score += 8
        elif asset_turnover > 0.7:
            score += 5
        elif asset_turnover < 0.3:
            score -= 5
        
        return max(0, min(100, score))
    
    @staticmethod
    def _determine_risk_level(score: float) -> str:
        """Determine overall risk level from combined score"""
        if score >= 75:
            return "low"
        elif score >= 55:
            return "medium"
        else:
            return "high"