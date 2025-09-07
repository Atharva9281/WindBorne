import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Building2, MapPin, Users, Calendar, TrendingUp, TrendingDown, 
  DollarSign, Target, AlertTriangle, Shield, AlertCircle, ExternalLink 
} from 'lucide-react';
import { VendorData, formatCurrency, formatPercentage, getRiskBadgeClass, safeNumber, safeArray } from '@/data/mockVendorData';

interface VendorDetailModalProps {
  vendor: VendorData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorDetailModal({ vendor, isOpen, onClose }: VendorDetailModalProps) {
  if (!vendor) return null;

  // Safe access to quarterly revenue data
  const quarterlyRevenue = safeArray(vendor.quarterlyRevenue);
  const hasQuarterlyData = quarterlyRevenue.length > 0;
  
  const currentQuarter = hasQuarterlyData ? quarterlyRevenue[quarterlyRevenue.length - 1] : safeNumber(vendor.revenue);
  const previousQuarter = hasQuarterlyData && quarterlyRevenue.length > 1 ? quarterlyRevenue[quarterlyRevenue.length - 2] : currentQuarter;
  const isRevenueUp = currentQuarter > previousQuarter;
  const revenueChange = previousQuarter > 0 ? ((currentQuarter - previousQuarter) / previousQuarter * 100) : 0;

  // Prepare chart data safely
  const quarterlyData = hasQuarterlyData 
    ? quarterlyRevenue.map((revenue, index) => ({
        quarter: `Q${index + 1}`,
        revenue: safeNumber(revenue),
        growth: index > 0 && quarterlyRevenue[index - 1] > 0 ? 
          ((revenue - quarterlyRevenue[index - 1]) / quarterlyRevenue[index - 1] * 100) : 0
      }))
    : [{ quarter: 'Current', revenue: safeNumber(vendor.revenue), growth: 0 }];

  const riskIndicator = {
    low: { color: 'bg-emerald-500', label: 'Low Risk', icon: Shield, description: 'Stable financial performance with consistent growth' },
    medium: { color: 'bg-amber-500', label: 'Medium Risk', icon: AlertCircle, description: 'Some volatility but generally stable operations' },
    high: { color: 'bg-red-500', label: 'High Risk', icon: AlertTriangle, description: 'Higher volatility and potential supply chain concerns' }
  }[vendor.riskLevel];

  const RiskIcon = riskIndicator.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{vendor.symbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{vendor.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-primary font-semibold">{vendor.symbol}</span>
                <Badge variant="secondary">{vendor.industry}</Badge>
                <Badge className={getRiskBadgeClass(vendor.riskLevel)}>
                  {vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1)} Risk
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="dashboard-card p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Market Cap</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(vendor.marketCap)}</div>
            </div>
            
            <div className="dashboard-card p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Revenue (Q4)</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(vendor.revenue)}</div>
              <div className={`text-sm flex items-center space-x-1 mt-1 ${
                isRevenueUp ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {isRevenueUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% QoQ</span>
              </div>
            </div>
            
            <div className="dashboard-card p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Profit Margin</span>
              </div>
              <div className={`text-2xl font-bold ${
                vendor.profitMargin > 10 ? 'text-emerald-600' : 
                vendor.profitMargin > 5 ? 'text-amber-600' : 
                'text-red-600'
              }`}>
                {formatPercentage(vendor.profitMargin)}
              </div>
            </div>
            
            <div className="dashboard-card p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">P/E Ratio</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{vendor.peRatio.toFixed(1)}</div>
            </div>
          </div>

          {/* Company Information */}
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <div className="font-medium text-foreground">{vendor.industry}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Headquarters</span>
                    <div className="font-medium text-foreground">{vendor.headquarters}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Employees</span>
                    <div className="font-medium text-foreground">{safeNumber(vendor.employees, 0).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Founded</span>
                    <div className="font-medium text-foreground">{vendor.founded}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Performance */}
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Stock Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Price</span>
                <span className="text-xl font-bold text-foreground">${vendor.stockPrice.toFixed(2)}</span>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">52-Week Range</span>
                  <span className="text-sm font-medium text-foreground">
                    ${vendor.weekLow52.toFixed(2)} - ${vendor.weekHigh52.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 relative">
                  <div 
                    className="bg-gradient-primary h-3 rounded-full"
                    style={{ 
                      width: `${((vendor.stockPrice - vendor.weekLow52) / (vendor.weekHigh52 - vendor.weekLow52)) * 100}%` 
                    }}
                  />
                  <div 
                    className="absolute top-0 w-1 h-3 bg-foreground rounded-full"
                    style={{ 
                      left: `${((vendor.stockPrice - vendor.weekLow52) / (vendor.weekHigh52 - vendor.weekLow52)) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  Current position: {(((vendor.stockPrice - vendor.weekLow52) / (vendor.weekHigh52 - vendor.weekLow52)) * 100).toFixed(1)}% of range
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quarterly Revenue Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="quarter" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}B`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [`$${value.toFixed(1)}B`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Risk Assessment</h3>
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${riskIndicator.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                <RiskIcon className={`h-6 w-6 ${riskIndicator.color.replace('bg-', 'text-').replace('-500', '-600')}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-foreground">{riskIndicator.label}</span>
                  <Badge className={getRiskBadgeClass(vendor.riskLevel)}>
                    {vendor.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{riskIndicator.description}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Risk Factors:</span>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {vendor.riskLevel === 'high' && (
                        <>
                          <li>• High P/E ratio indicating potential overvaluation</li>
                          <li>• Market volatility in commodities sector</li>
                        </>
                      )}
                      {vendor.riskLevel === 'medium' && (
                        <>
                          <li>• Moderate market volatility</li>
                          <li>• Industry cyclical trends</li>
                        </>
                      )}
                      {vendor.riskLevel === 'low' && (
                        <>
                          <li>• Stable revenue growth</li>
                          <li>• Strong market position</li>
                          <li>• Consistent profitability</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-primary hover:bg-primary-dark">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}