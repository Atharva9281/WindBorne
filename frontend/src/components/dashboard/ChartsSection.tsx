import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ScatterChart, Scatter, ComposedChart, Line } from 'recharts';
import { VendorData } from '@/data/mockVendorData';

interface ChartsSectionProps {
  vendors: VendorData[];
}

export function ChartsSection({ vendors }: ChartsSectionProps) {
  // Prepare Risk vs Performance data for scatter plot
  const prepareRiskPerformanceData = () => {
    return vendors.map(vendor => ({
      name: vendor.name || vendor.symbol,
      symbol: vendor.symbol,
      riskScore: vendor.riskScore || 50,
      profitMargin: vendor.profitMargin || 0,
      marketCap: vendor.marketCap || 0,
      industry: vendor.industry,
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  const riskPerformanceData = prepareRiskPerformanceData();

  // Prepare market cap vs revenue efficiency data
  const prepareMarketCapRevenueData = () => {
    return vendors.map(vendor => ({
      name: vendor.symbol,
      fullName: vendor.name || vendor.symbol,
      marketCap: Number(vendor.marketCap) || 0,
      revenue: Number(vendor.revenue) || 0,
      efficiency: vendor.marketCap > 0 ? (vendor.revenue / vendor.marketCap * 100) : 0,
      industry: vendor.industry || 'Unknown',
      fill: vendor.industry === 'Sensors' ? '#3b82f6' : '#10b981'
    }));
  };

  const marketCapRevenueData = prepareMarketCapRevenueData();

  // Prepare industry comparison data
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
        avgProfitMargin: avgCalc(sensorVendors, 'profitMargin'),
        avgRiskScore: avgCalc(sensorVendors, 'riskScore') || 50,
        count: sensorVendors.length,
        fill: '#3b82f6'
      },
      {
        industry: 'Materials',
        avgMarketCap: avgCalc(materialVendors, 'marketCap'),
        avgProfitMargin: avgCalc(materialVendors, 'profitMargin'),
        avgRiskScore: avgCalc(materialVendors, 'riskScore') || 50,
        count: materialVendors.length,
        fill: '#10b981'
      }
    ];
  };

  const industryData = prepareIndustryData();

  const RiskPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.industry}</p>
          <p className="text-sm">Risk Score: {data.riskScore}/100</p>
          <p className="text-sm">Profit Margin: {data.profitMargin.toFixed(1)}%</p>
          <p className="text-sm">Market Cap: ${data.marketCap.toFixed(1)}B</p>
        </div>
      );
    }
    return null;
  };

  const MarketCapRevenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.industry}</p>
          <p className="text-sm">Market Cap: ${data.marketCap.toFixed(1)}B</p>
          <p className="text-sm">Revenue: ${data.revenue.toFixed(1)}B</p>
          <p className="text-sm">Efficiency: {data.efficiency.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Risk vs Performance Analysis */}
        <div className="dashboard-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Risk vs Performance Analysis</h3>
            <p className="text-sm text-muted-foreground">Optimal vendors in top-left quadrant (high performance, low risk)</p>
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

          {/* Quadrant Guide */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600">✓ Optimal Zone</div>
              <div className="text-muted-foreground">High Performance + Low Risk</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600">⚠ Monitor</div>
              <div className="text-muted-foreground">Review regularly</div>
            </div>
          </div>
        </div>

        {/* Market Cap vs Revenue Efficiency */}
        <div className="dashboard-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Market Cap vs Revenue Efficiency</h3>
            <p className="text-sm text-muted-foreground">Companies with higher revenue-to-market-cap ratios are more efficient</p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marketCapRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(1)}B`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip content={<MarketCapRevenueTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="marketCap" name="Market Cap" fill="#3b82f6" />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10b981" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={3} name="Revenue Efficiency" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Industry Breakdown */}
          <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-foreground">Sensors</span>
              <span className="text-xs text-muted-foreground">
                ({vendors.filter(v => v.industry === 'Sensors').length} companies)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-foreground">Materials</span>
              <span className="text-xs text-muted-foreground">
                ({vendors.filter(v => v.industry === 'Materials' || v.industry === 'Plastics').length} companies)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Performance Comparison */}
      <div className="dashboard-card p-6 mt-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Industry Performance Comparison</h3>
          <p className="text-sm text-muted-foreground">Comparative analysis between Sensors and Materials industries</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Market Cap */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Average Market Cap</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="industry" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(value) => `$${value.toFixed(0)}B`}
                  />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}B`, 'Avg Market Cap']} />
                  <Bar dataKey="avgMarketCap" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Average Profit Margin */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Average Profit Margin</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="industry" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Avg Profit Margin']} />
                  <Bar dataKey="avgProfitMargin" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Average Risk Score */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Average Risk Score</h4>
            <div className="h-48">
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
                  <Tooltip formatter={(value) => [`${Math.round(Number(value))}/100`, 'Avg Risk Score']} />
                  <Bar dataKey="avgRiskScore" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Summary insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Sensors Industry:</strong> {industryData[0]?.count || 0} vendors with average {industryData[0]?.avgProfitMargin.toFixed(1) || '0'}% profit margin
            </div>
            <div>
              <strong className="text-foreground">Materials Industry:</strong> {industryData[1]?.count || 0} vendors with average {industryData[1]?.avgProfitMargin.toFixed(1) || '0'}% profit margin
            </div>
          </div>
        </div>
      </div>
    </>
  );
}