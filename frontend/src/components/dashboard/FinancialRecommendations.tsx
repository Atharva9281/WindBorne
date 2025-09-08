import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { VendorData } from '@/data/mockVendorData';

interface FinancialRecommendationsProps {
  vendors: VendorData[];
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedVendors: string[];
  action: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function FinancialRecommendations({ vendors }: FinancialRecommendationsProps) {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // High debt-to-equity vendors
    const highDebtVendors = vendors.filter(v => (v.financialRatios?.debt_to_equity || 0) > 1.0);
    if (highDebtVendors.length > 0) {
      recommendations.push({
        id: 'high-debt',
        priority: 'high',
        title: 'Monitor High-Debt Vendors',
        description: `${highDebtVendors.length} vendors have debt-to-equity ratios above 1.0, indicating potential financial stress and higher risk of default.`,
        affectedVendors: highDebtVendors.map(v => v.symbol),
        action: 'Consider diversifying away from high-debt vendors or implementing additional monitoring protocols.',
        icon: AlertTriangle
      });
    }

    // Low liquidity concerns
    const lowLiquidityVendors = vendors.filter(v => (v.financialRatios?.current_ratio || 0) < 1.0);
    if (lowLiquidityVendors.length > 0) {
      recommendations.push({
        id: 'low-liquidity',
        priority: 'high',
        title: 'Liquidity Concerns',
        description: `${lowLiquidityVendors.length} vendors have current ratios below 1.0, indicating potential difficulty meeting short-term obligations.`,
        affectedVendors: lowLiquidityVendors.map(v => v.symbol),
        action: 'Review payment terms and consider requiring additional financial guarantees.',
        icon: AlertTriangle
      });
    }

    // Low cash position vendors
    const lowCashVendors = vendors.filter(v => (v.financialRatios?.cash_ratio || 0) < 0.05);
    if (lowCashVendors.length > 0) {
      recommendations.push({
        id: 'low-cash',
        priority: 'medium',
        title: 'Cash Position Concerns',
        description: `${lowCashVendors.length} vendors have cash ratios below 5%, which may limit operational flexibility during market downturns.`,
        affectedVendors: lowCashVendors.map(v => v.symbol),
        action: 'Monitor quarterly cash flow reports and establish contingency supplier relationships.',
        icon: AlertCircle
      });
    }

    // Poor profitability
    const unprofitableVendors = vendors.filter(v => v.profitMargin < 0);
    if (unprofitableVendors.length > 0) {
      recommendations.push({
        id: 'unprofitable',
        priority: 'high',
        title: 'Unprofitable Operations',
        description: `${unprofitableVendors.length} vendors are currently operating at a loss, which raises sustainability concerns.`,
        affectedVendors: unprofitableVendors.map(v => v.symbol),
        action: 'Evaluate long-term viability and consider reducing dependency on these suppliers.',
        icon: TrendingDown
      });
    }

    // High financial stability vendors (positive recommendation)
    const financiallyStableVendors = vendors.filter(v => 
      (v.riskScores?.financial_stability || v.financialStability || 0) > 75 &&
      (v.financialRatios?.debt_to_equity || 0) < 0.6 &&
      v.profitMargin > 5
    );
    if (financiallyStableVendors.length > 0) {
      recommendations.push({
        id: 'optimal-partners',
        priority: 'low',
        title: 'Optimal Vendor Partners',
        description: `${financiallyStableVendors.length} vendors demonstrate exceptional financial health across all metrics with strong balance sheets and profitability.`,
        affectedVendors: financiallyStableVendors.map(v => v.symbol),
        action: 'Consider increasing business allocation and establishing preferred supplier agreements.',
        icon: CheckCircle
      });
    }

    // Portfolio concentration risk
    const industryBreakdown = vendors.reduce((acc, vendor) => {
      acc[vendor.industry] = (acc[vendor.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(industryBreakdown);
    const dominantIndustry = entries.length > 0 ? entries.reduce((a, b) => a[1] > b[1] ? a : b) : ['', 0] as [string, number];
    if (vendors.length > 0 && dominantIndustry[1] / vendors.length > 0.7) {
      recommendations.push({
        id: 'concentration-risk',
        priority: 'medium',
        title: 'Industry Concentration Risk',
        description: `${((dominantIndustry[1] / vendors.length) * 100).toFixed(0)}% of your vendor portfolio is concentrated in ${dominantIndustry[0]}, creating sector-specific risk exposure.`,
        affectedVendors: vendors.filter(v => v.industry === dominantIndustry[0]).map(v => v.symbol),
        action: 'Diversify supplier base across different industries to reduce concentration risk.',
        icon: Shield
      });
    }

    // Growth prospects analysis
    const lowGrowthVendors = vendors.filter(v => (v.riskScores?.growth_prospects || v.growthProspects || 0) < 40);
    if (lowGrowthVendors.length > vendors.length * 0.3) {
      recommendations.push({
        id: 'growth-concerns',
        priority: 'medium',
        title: 'Limited Growth Prospects',
        description: `${lowGrowthVendors.length} vendors (${((lowGrowthVendors.length / vendors.length) * 100).toFixed(0)}%) show limited growth prospects, which may impact long-term competitiveness.`,
        affectedVendors: lowGrowthVendors.map(v => v.symbol),
        action: 'Evaluate vendor innovation capabilities and consider sourcing from more growth-oriented suppliers.',
        icon: TrendingUp
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const recommendations = generateRecommendations();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIconColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="dashboard-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Strategic Recommendations</h3>
          <p className="text-sm text-muted-foreground">Automated insights based on comprehensive financial analysis</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-foreground font-medium">Excellent Portfolio Health</p>
            <p className="text-sm text-muted-foreground">All vendors meet financial stability criteria. No immediate actions required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Strategic Recommendations</h3>
        <p className="text-sm text-muted-foreground">Data-driven insights from Alpha Vantage financial analysis</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const IconComponent = rec.icon;
          return (
            <div key={rec.id} className={`rounded-lg border-2 p-4 ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg bg-white/50 ${getPriorityIconColor(rec.priority)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(rec.priority)}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-3">{rec.description}</p>
                  <div className="mb-3">
                    <p className="text-xs font-medium text-foreground/70 mb-1">AFFECTED VENDORS:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.affectedVendors.map((symbol) => (
                        <span key={symbol} className="px-2 py-1 bg-white/80 rounded text-xs font-mono border">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/80 rounded p-3 border-l-4 border-blue-500">
                    <p className="text-xs font-medium text-blue-800 mb-1">RECOMMENDED ACTION:</p>
                    <p className="text-sm text-blue-700">{rec.action}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Analysis based on {vendors.filter(v => v.balanceSheet).length} vendors with complete balance sheet data
          </div>
          <div className="flex space-x-4">
            <span className="text-red-600">
              {recommendations.filter(r => r.priority === 'high').length} High Priority
            </span>
            <span className="text-yellow-600">
              {recommendations.filter(r => r.priority === 'medium').length} Medium Priority
            </span>
            <span className="text-green-600">
              {recommendations.filter(r => r.priority === 'low').length} Low Priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}