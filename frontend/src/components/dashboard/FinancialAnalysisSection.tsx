import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { VendorData } from '@/data/mockVendorData';

interface FinancialAnalysisSectionProps {
  vendors: VendorData[];
}

export function FinancialAnalysisSection({ vendors }: FinancialAnalysisSectionProps) {
  // Enhanced Risk vs Performance with Financial Stability
  const prepareRiskPerformanceData = () => {
    return vendors.map(vendor => ({
      name: vendor.symbol,
      fullName: vendor.name,
      riskScore: vendor.riskScores?.risk_score || vendor.riskScore || 50,
      profitMargin: vendor.profitMargin || 0,
      financialStability: vendor.riskScores?.financial_stability || vendor.financialStability || 50,
      marketCap: vendor.marketCap || 0,
      industry: vendor.industry,
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  // Financial Structure Analysis
  const prepareFinancialStructureData = () => {
    return vendors.map(vendor => ({
      name: vendor.symbol,
      fullName: vendor.name,
      assets: (vendor.balanceSheet?.total_assets || 0) / 1000000000,
      liabilities: (vendor.balanceSheet?.total_liabilities || 0) / 1000000000,
      equity: (vendor.balanceSheet?.total_shareholder_equity || 0) / 1000000000,
      industry: vendor.industry,
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  // Debt-to-Equity Analysis
  const prepareDebtEquityData = () => {
    return vendors.map(vendor => ({
      name: vendor.symbol,
      fullName: vendor.name,
      debtEquity: vendor.financialRatios?.debt_to_equity || vendor.debtToEquity || 0,
      industry: vendor.industry,
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  // Cash Position Analysis
  const prepareCashPositionData = () => {
    return vendors.map(vendor => ({
      name: vendor.symbol,
      fullName: vendor.name,
      cashPosition: (vendor.balanceSheet?.cash_and_cash_equivalents || 0) / 1000000000,
      cashRatio: vendor.financialRatios?.cash_ratio || 0,
      industry: vendor.industry,
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  // Industry Comparison
  const prepareIndustryData = () => {
    const sensorVendors = vendors.filter(v => v.industry === 'Sensors');
    const materialVendors = vendors.filter(v => v.industry === 'Materials' || v.industry === 'Plastics');
    
    const avgCalc = (arr: any[], field: string) => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, v) => sum + (v[field] || 0), 0) / arr.length;
    };

    return [
      {
        industry: 'Sensors',
        avgMarketCap: avgCalc(sensorVendors, 'marketCap'),
        avgDebtEquity: avgCalc(sensorVendors.map(v => ({ debtEquity: v.financialRatios?.debt_to_equity || 0 })), 'debtEquity'),
        avgFinancialStability: avgCalc(sensorVendors.map(v => ({ stability: v.riskScores?.financial_stability || 50 })), 'stability'),
        count: sensorVendors.length,
        fill: '#3b82f6'
      },
      {
        industry: 'Materials',
        avgMarketCap: avgCalc(materialVendors, 'marketCap'),
        avgDebtEquity: avgCalc(materialVendors.map(v => ({ debtEquity: v.financialRatios?.debt_to_equity || 0 })), 'debtEquity'),
        avgFinancialStability: avgCalc(materialVendors.map(v => ({ stability: v.riskScores?.financial_stability || 50 })), 'stability'),
        count: materialVendors.length,
        fill: '#10b981'
      }
    ];
  };

  const riskPerformanceData = prepareRiskPerformanceData();
  const financialStructureData = prepareFinancialStructureData();
  const debtEquityData = prepareDebtEquityData();
  const cashPositionData = prepareCashPositionData();
  const industryData = prepareIndustryData();

  const RiskPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.industry}</p>
          <p className="text-sm">Risk Score: {data.riskScore}/100</p>
          <p className="text-sm">Profit Margin: {data.profitMargin.toFixed(1)}%</p>
          <p className="text-sm">Financial Stability: {data.financialStability}/100</p>
          <p className="text-sm">Market Cap: ${data.marketCap.toFixed(1)}B</p>
        </div>
      );
    }
    return null;
  };

  const FinancialStructureTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.industry}</p>
          <p className="text-sm">Assets: ${data.assets.toFixed(1)}B</p>
          <p className="text-sm">Liabilities: ${data.liabilities.toFixed(1)}B</p>
          <p className="text-sm">Equity: ${data.equity.toFixed(1)}B</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Enhanced Financial Analysis</h2>
        <p className="text-muted-foreground">Comprehensive vendor assessment using three fundamental data sources</p>
      </div>
      
      {/* Top Row - Main Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk vs Performance with Financial Stability */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <h3 className="font-medium text-foreground">Risk vs Performance vs Financial Stability</h3>
            <p className="text-sm text-muted-foreground">Enhanced 4-component risk assessment</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={riskPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="riskScore" 
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Risk Score (0-100)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="profitMargin"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Profit Margin (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<RiskPerformanceTooltip />} />
                <Scatter dataKey="profitMargin" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Top-right quadrant shows optimal vendors (high performance, low risk)
          </div>
        </div>

        {/* Financial Structure Analysis */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <h3 className="font-medium text-foreground">Financial Structure Analysis</h3>
            <p className="text-sm text-muted-foreground">Assets vs Liabilities from Balance Sheet data</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialStructureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(0)}B`}
                />
                <Tooltip content={<FinancialStructureTooltip />} />
                <Legend />
                <Bar dataKey="assets" fill="#3b82f6" name="Total Assets" />
                <Bar dataKey="liabilities" fill="#ef4444" name="Total Liabilities" />
                <Bar dataKey="equity" fill="#10b981" name="Shareholder Equity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row - Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debt-to-Equity Analysis */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <h3 className="font-medium text-foreground">Debt-to-Equity Ratios</h3>
            <p className="text-sm text-muted-foreground">Lower is generally better</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtEquityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Debt/Equity']} />
                <Bar dataKey="debtEquity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Target: &lt; 0.6 for strong balance sheet
          </div>
        </div>

        {/* Cash Position Analysis */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <h3 className="font-medium text-foreground">Cash Position</h3>
            <p className="text-sm text-muted-foreground">Liquidity strength</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashPositionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(value) => `$${value.toFixed(1)}B`}
                />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}B`, 'Cash Position']} />
                <Bar dataKey="cashPosition" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Higher cash provides operational flexibility
          </div>
        </div>

        {/* Industry Comparison */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <h3 className="font-medium text-foreground">Industry Comparison</h3>
            <p className="text-sm text-muted-foreground">Financial Stability Scores</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="industry" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(value) => `${value}/100`}
                />
                <Tooltip formatter={(value) => [`${Math.round(Number(value))}/100`, 'Avg Financial Stability']} />
                <Bar dataKey="avgFinancialStability" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Balance sheet strength comparison
          </div>
        </div>
      </div>

      {/* Key Insights Summary */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Key Financial Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Balance Sheet Integration:</strong> Now analyzing {vendors.filter(v => v.balanceSheet).length} vendors with complete balance sheet data
          </div>
          <div>
            <strong className="text-foreground">4-Component Risk Model:</strong> Enhanced scoring includes Financial Health, Market Stability, Growth Prospects, and Financial Stability
          </div>
        </div>
      </div>
    </section>
  );
}