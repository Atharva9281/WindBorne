import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { VendorData, formatCurrency, formatPercentage, getRiskBadgeClass } from '@/data/mockVendorData';

interface VendorCardProps {
  vendor: VendorData;
  onViewDetails: (symbol: string) => void;
}

export function VendorCard({ vendor, onViewDetails }: VendorCardProps) {
  const currentQuarter = vendor.quarterlyRevenue[vendor.quarterlyRevenue.length - 1];
  const previousQuarter = vendor.quarterlyRevenue[vendor.quarterlyRevenue.length - 2];
  const isRevenueUp = currentQuarter > previousQuarter;
  
  const riskIndicator = {
    low: { color: 'bg-emerald-500', label: 'Low Risk' },
    medium: { color: 'bg-amber-500', label: 'Medium Risk' },
    high: { color: 'bg-red-500', label: 'High Risk' }
  }[vendor.riskLevel];

  return (
    <div className="dashboard-card-elevated p-6 hover:shadow-hover transition-all duration-300 group h-full flex flex-col">
      {/* Header - Fixed Height */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{vendor.symbol.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {vendor.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-primary">{vendor.symbol}</span>
              <Badge variant="secondary" className="text-xs">
                {vendor.industry}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Risk Indicator - Fixed Position */}
        <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-3">
          <div className={`w-3 h-3 rounded-full ${riskIndicator.color}`} />
          <span className="text-xs text-muted-foreground text-right">{riskIndicator.label}</span>
        </div>
      </div>

      {/* Key Metrics - Consistent Spacing */}
      <div className="space-y-4 mb-6 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Market Cap</span>
          <span className="font-semibold text-foreground">{formatCurrency(vendor.marketCap)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Revenue (Q4)</span>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">{formatCurrency(vendor.revenue)}</span>
            {isRevenueUp ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Profit Margin</span>
          <span className={`font-semibold ${
            vendor.profitMargin > 10 ? 'text-emerald-600' : 
            vendor.profitMargin > 5 ? 'text-amber-600' : 
            'text-red-600'
          }`}>
            {formatPercentage(vendor.profitMargin)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">P/E Ratio</span>
          <span className="font-semibold text-foreground">{vendor.peRatio.toFixed(1)}</span>
        </div>
      </div>

      {/* Stock Price Range - Consistent Height */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">52W Range</span>
          <span className="text-sm font-medium text-foreground">${vendor.stockPrice.toFixed(2)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 relative">
          <div 
            className="bg-gradient-primary h-2 rounded-full"
            style={{ 
              width: `${((vendor.stockPrice - vendor.weekLow52) / (vendor.weekHigh52 - vendor.weekLow52)) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${vendor.weekLow52.toFixed(2)}</span>
          <span>${vendor.weekHigh52.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button - Fixed at Bottom */}
      <Button 
        variant="outline" 
        className="w-full border-border hover:bg-accent hover:border-primary transition-all group-hover:border-primary mt-auto"
        onClick={() => onViewDetails(vendor.symbol)}
      >
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>
    </div>
  );
}