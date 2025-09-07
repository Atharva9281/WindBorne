import React from 'react';
import { TrendingUp, Users, DollarSign, Shield, Award, BarChart3, Building, Banknote } from 'lucide-react';
import { VendorData, formatCurrency, formatPercentage } from '@/data/mockVendorData';
import { KPIsResponse } from '@/services/api';

interface KPICardsProps {
  vendors: VendorData[];
  kpis?: KPIsResponse | null;
}

interface KPICardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

function KPICard({ icon: Icon, value, label, trend, trendDirection = 'neutral' }: KPICardProps) {
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up': return 'text-emerald-500';
      case 'down': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <div className="dashboard-card p-4 lg:p-6 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${getTrendColor()}`}>
            <span className="mr-1">{getTrendIcon()}</span>
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{value}</div>
        <div className="text-xs lg:text-sm text-muted-foreground line-clamp-2">{label}</div>
      </div>
    </div>
  );
}

export function KPICards({ vendors, kpis }: KPICardsProps) {
  // Use API KPIs if available, otherwise calculate from vendor data
  if (kpis) {
    // Use API KPIs - these come directly from backend calculations
    const sensorsCount = vendors.filter(v => v.industry === 'Sensors').length;
    const materialsCount = vendors.filter(v => v.industry === 'Materials' || v.industry === 'Plastics').length;
    
    return (
      <section className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Key Performance Indicators</h2>
          <p className="text-muted-foreground">Real-time metrics from Alpha Vantage data</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          <KPICard
            icon={Users}
            value={kpis.activeVendors.toString()}
            label="Active Vendors"
            trend="Live Data"
            trendDirection="neutral"
          />
          
          <KPICard
            icon={DollarSign}
            value={kpis.totalPortfolioValue}
            label="Total Portfolio Value"
            trend="Real-time"
            trendDirection="up"
          />
          
          <KPICard
            icon={TrendingUp}
            value={kpis.avgProfitMargin}
            label="Average Profit Margin"
            trend="Alpha Vantage"
            trendDirection={parseFloat(kpis.avgProfitMargin) > 0 ? "up" : "down"}
          />
          
          <KPICard
            icon={BarChart3}
            value={`${sensorsCount} vs ${materialsCount}`}
            label="Sensors vs Materials"
            trend="Balanced"
            trendDirection="neutral"
          />
          
          <KPICard
            icon={Shield}
            value={`${kpis.highRiskVendors} High Risk`}
            label={`Risk Score: ${kpis.avgRiskScore}`}
            trend="Risk Analysis"
            trendDirection={kpis.avgRiskScore >= 70 ? "up" : kpis.avgRiskScore >= 40 ? "neutral" : "down"}
          />
          
          <KPICard
            icon={Award}
            value={kpis.topPerformingVendor}
            label="Top Performer"
            trend="Best in Portfolio"
            trendDirection="up"
          />
        </div>
      </section>
    );
  }

  // Enhanced calculations with balance sheet metrics
  const totalVendors = vendors.length;
  const totalPortfolioValue = vendors.reduce((sum, v) => sum + v.marketCap, 0);
  const avgProfitMargin = vendors.length > 0 ? vendors.reduce((sum, v) => sum + v.profitMargin, 0) / vendors.length : 0;
  const sensorsCount = vendors.filter(v => v.industry === 'Sensors').length;
  const materialsCount = vendors.filter(v => v.industry === 'Materials' || v.industry === 'Plastics').length;
  const lowRiskCount = vendors.filter(v => v.riskLevel === 'low').length;
  
  // NEW: Balance sheet metrics
  const avgDebtEquityRatio = vendors.length > 0 ? 
    vendors.reduce((sum, v) => sum + (v.financialRatios?.debt_to_equity || 0), 0) / vendors.length : 0;
  const strongBalanceSheets = vendors.filter(v => 
    (v.financialRatios?.debt_to_equity || 0) < 0.6 && 
    (v.financialRatios?.current_ratio || 0) > 1.2
  ).length;
  const totalCashPosition = vendors.reduce((sum, v) => 
    sum + (v.balanceSheet?.cash_and_cash_equivalents || 0) / 1_000_000_000, 0
  );
  const avgFinancialStability = vendors.length > 0 ? 
    Math.round(vendors.reduce((sum, v) => sum + (v.riskScores?.financial_stability || 50), 0) / vendors.length) : 50;
  
  const bestPerformer = vendors.length > 0 ? vendors.reduce((prev, current) => 
    ((prev.riskScores?.risk_score || 0) > (current.riskScores?.risk_score || 0)) ? prev : current
  ) : null;

  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Key Performance Indicators</h2>
        <p className="text-muted-foreground">Overview of critical vendor portfolio metrics</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
        <KPICard
          icon={Users}
          value={totalVendors.toString()}
          label="Total Vendors"
          trend="Active"
          trendDirection="neutral"
        />
        
        <KPICard
          icon={DollarSign}
          value={formatCurrency(totalPortfolioValue)}
          label="Portfolio Value"
          trend="+3.8%"
          trendDirection="up"
        />
        
        <KPICard
          icon={TrendingUp}
          value={formatPercentage(avgProfitMargin)}
          label="Avg Profit Margin"
          trend="Strong"
          trendDirection={avgProfitMargin > 0 ? "up" : "down"}
        />
        
        <KPICard
          icon={Building}
          value={`${strongBalanceSheets}/${totalVendors}`}
          label="Strong Balance Sheets"
          trend="D/E < 0.6"
          trendDirection={strongBalanceSheets >= totalVendors * 0.6 ? "up" : "neutral"}
        />
        
        <KPICard
          icon={Banknote}
          value={`$${totalCashPosition.toFixed(1)}B`}
          label="Total Cash Position"
          trend="Liquidity"
          trendDirection="up"
        />
        
        <KPICard
          icon={Shield}
          value={`${avgFinancialStability}/100`}
          label="Avg Financial Stability"
          trend="4-Component Score"
          trendDirection={avgFinancialStability >= 70 ? "up" : avgFinancialStability >= 50 ? "neutral" : "down"}
        />
      </div>
    </section>
  );
}