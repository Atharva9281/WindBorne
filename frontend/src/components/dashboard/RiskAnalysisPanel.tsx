import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { VendorData, getRiskBadgeClass } from '@/data/mockVendorData';

interface RiskAnalysisPanelProps {
  vendors: VendorData[];
}

export function RiskAnalysisPanel({ vendors }: RiskAnalysisPanelProps) {
  const riskCounts = vendors.reduce((acc, vendor) => {
    acc[vendor.riskLevel] = (acc[vendor.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lowRiskVendors = vendors.filter(v => v.riskLevel === 'low');
  const mediumRiskVendors = vendors.filter(v => v.riskLevel === 'medium');
  const highRiskVendors = vendors.filter(v => v.riskLevel === 'high');

  const averageMargin = vendors.length > 0 ? vendors.reduce((sum, v) => sum + v.profitMargin, 0) / vendors.length : 0;
  const topPerformer = vendors.length > 0 ? vendors.reduce((prev, current) => 
    (prev.profitMargin > current.profitMargin) ? prev : current
  ) : null;
  const worstPerformer = vendors.length > 0 ? vendors.reduce((prev, current) => 
    (prev.profitMargin < current.profitMargin) ? prev : current
  ) : null;

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Risk Analysis</h3>
          <p className="text-sm text-muted-foreground">Vendor risk assessment and key insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <div className="w-3 h-3 bg-amber-500 rounded-full" />
          <div className="w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <Badge className="risk-low text-xs">Low Risk</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {riskCounts.low || 0}
          </div>
          <p className="text-sm text-emerald-700">
            {lowRiskVendors.length > 0 ? `${lowRiskVendors.map(v => v.symbol).join(', ')}` : 'None'}
          </p>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <Badge className="risk-medium text-xs">Medium Risk</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {riskCounts.medium || 0}
          </div>
          <p className="text-sm text-amber-700">
            {mediumRiskVendors.length > 0 ? `${mediumRiskVendors.map(v => v.symbol).join(', ')}` : 'None'}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <Badge className="risk-high text-xs">High Risk</Badge>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {riskCounts.high || 0}
          </div>
          <p className="text-sm text-red-700">
            {highRiskVendors.length > 0 ? `${highRiskVendors.map(v => v.symbol).join(', ')}` : 'None'}
          </p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground">Key Insights</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-foreground">Top Performer</span>
            </div>
            <div className="text-sm">
              {topPerformer ? (
                <>
                  <span className="font-semibold text-primary">{topPerformer.name}</span>
                  <span className="text-muted-foreground"> with </span>
                  <span className="font-semibold text-emerald-600">
                    {topPerformer.profitMargin.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground"> profit margin</span>
                </>
              ) : (
                <span className="text-muted-foreground">No data available</span>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="font-medium text-foreground">Needs Attention</span>
            </div>
            <div className="text-sm">
              {worstPerformer ? (
                <>
                  <span className="font-semibold text-primary">{worstPerformer.name}</span>
                  <span className="text-muted-foreground"> with </span>
                  <span className="font-semibold text-red-600">
                    {worstPerformer.profitMargin.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground"> profit margin</span>
                </>
              ) : (
                <span className="text-muted-foreground">No data available</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Portfolio Average Margin</span>
            <span className="text-lg font-semibold text-primary">
              {averageMargin.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Based on {vendors.length} vendor analysis
          </div>
        </div>

        {/* Recommendations */}
        <div className="border-t border-border pt-4">
          <h5 className="font-medium text-foreground mb-2">Recommendations</h5>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {highRiskVendors.length > 0 && (
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  Review high-risk vendors ({highRiskVendors.map(v => v.symbol).join(', ')}) for potential supply chain disruption
                </span>
              </li>
            )}
            {lowRiskVendors.length > 2 && (
              <li className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  Strong vendor portfolio with {lowRiskVendors.length} low-risk suppliers providing stability
                </span>
              </li>
            )}
            <li className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Consider increasing allocation to {topPerformer.symbol} given superior margin performance
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}