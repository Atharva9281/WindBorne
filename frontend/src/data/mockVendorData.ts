export interface VendorData {
  id?: number;
  symbol: string;
  name: string;
  industry: 'Sensors' | 'Materials' | 'Plastics';
  vendorType: 'Sensor Supplier' | 'Materials Supplier';
  marketCap: number; // in billions
  revenue: number; // in billions
  profitMargin: number; // percentage
  peRatio: number;
  riskLevel: 'low' | 'medium' | 'high';
  quarterlyRevenue?: number[]; // last 4 quarters
  weekHigh52: number;
  weekLow52: number;
  lastUpdated: string;
  stockPrice?: number;
  currentPrice?: number;
  employees?: number;
  founded?: number;
  headquarters?: string;
  // Additional fields from backend
  riskScore?: number;
  financialHealth?: number;
  marketStability?: number;
  growthProspects?: number;
  financialStability?: number; // NEW: 4th component
  beta?: number;
  roe?: number;
  debtToEquity?: number;
  
  // NEW: Balance Sheet Data
  balanceSheet?: {
    total_assets?: number;
    total_liabilities?: number;
    total_shareholder_equity?: number;
    cash_and_cash_equivalents?: number;
    short_term_debt?: number;
    long_term_debt?: number;
    total_current_assets?: number;
    total_current_liabilities?: number;
    fiscal_date_ending?: string;
  };
  
  // NEW: Financial Ratios
  financialRatios?: {
    debt_to_equity?: number;
    total_debt_to_equity?: number;
    current_ratio?: number;
    quick_ratio?: number;
    cash_ratio?: number;
    asset_turnover?: number;
    working_capital?: number;
    equity_ratio?: number;
  };
  
  // Enhanced risk scores object
  riskScores?: {
    financial_health?: number;
    market_stability?: number;
    growth_prospects?: number;
    financial_stability?: number;
    risk_score?: number;
    overall?: string;
  };
}

// Removed hardcoded financial data - all data now comes from Alpha Vantage API

// Legacy functions removed - vendor data now comes from API

export const formatCurrency = (value: number, suffix = 'B'): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '$0';
  }
  return `$${Number(value).toFixed(1)}${suffix}`;
};

export const formatPercentage = (value: number): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  const numValue = Number(value);
  if (numValue < 0) {
    return `(${Math.abs(numValue).toFixed(1)}%)`;
  }
  return `${numValue.toFixed(1)}%`;
};

export const formatPERatio = (value: number): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  const numValue = Number(value);
  if (numValue <= 0 || numValue > 1000) {
    return 'N/A';
  }
  return numValue.toFixed(1);
};

export const formatROE = (value: number): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  const numValue = Number(value);
  if (numValue < 0) {
    return `(${Math.abs(numValue).toFixed(1)}%)`;
  }
  return `${numValue.toFixed(1)}%`;
};

// Additional safe formatting functions
export const safeNumber = (value: any, decimals = 1): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0;
  }
  return Number(Number(value).toFixed(decimals));
};

export const safeString = (value: any, fallback = 'N/A'): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

export const safeArray = (value: any): any[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
};

export const getRiskColor = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'low': return 'text-emerald-600';
    case 'medium': return 'text-amber-600';
    case 'high': return 'text-red-600';
  }
};

export const getRiskBadgeClass = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'low': return 'risk-low';
    case 'medium': return 'risk-medium';
    case 'high': return 'risk-high';
  }
};

export const getVendorTypeBadgeClass = (vendorType: 'Sensor Supplier' | 'Materials Supplier'): string => {
  switch (vendorType) {
    case 'Sensor Supplier': return 'bg-blue-100 text-blue-800';
    case 'Materials Supplier': return 'bg-green-100 text-green-800';
  }
};

// Import types from API service
import type { BackendVendor } from '@/services/api';

/**
 * Map backend vendor data to frontend VendorData format
 */
export const mapBackendVendorToFrontend = (backendVendor: BackendVendor): VendorData => {
  try {
    // Map industry to match frontend expectations - preserve Materials as Materials for correct categorization
    const industry = backendVendor.industry === 'Sensors' ? 'Sensors' : 'Materials';

    return {
      id: backendVendor.id || 0,
      symbol: safeString(backendVendor.symbol),
      name: safeString(backendVendor.name),
      industry: industry as 'Sensors' | 'Materials' | 'Plastics',
      vendorType: backendVendor.vendorType || 'Materials Supplier',
      marketCap: safeNumber(backendVendor.marketCap / 1_000_000_000), // Convert to billions
      revenue: safeNumber(backendVendor.revenue / 1_000_000_000), // Convert to billions
      profitMargin: safeNumber(backendVendor.profitMargin),
      peRatio: safeNumber(backendVendor.peRatio), // Will be handled by formatPERatio for display
      riskLevel: (backendVendor.risk as 'low' | 'medium' | 'high') || 'medium',
      quarterlyRevenue: safeArray(backendVendor.quarterlyRevenue), // Will be filled from detail API if needed
      weekHigh52: safeNumber(backendVendor.weekHigh52),
      weekLow52: safeNumber(backendVendor.weekLow52),
      lastUpdated: safeString(backendVendor.lastUpdated, new Date().toISOString()),
      currentPrice: safeNumber(backendVendor.currentPrice),
      stockPrice: safeNumber(backendVendor.currentPrice), // Use currentPrice as stockPrice
      riskScore: Math.round(safeNumber(backendVendor.riskScore)),
      financialHealth: Math.round(safeNumber(backendVendor.financialHealth)),
      marketStability: Math.round(safeNumber(backendVendor.marketStability)),
      growthProspects: Math.round(safeNumber(backendVendor.growthProspects)),
      beta: safeNumber(backendVendor.beta, 3),
      roe: safeNumber(backendVendor.roe),
      debtToEquity: safeNumber(backendVendor.debtToEquity, 2),
    };
  } catch (error) {
    console.error('Error mapping backend vendor to frontend:', error, backendVendor);
    // Return a safe fallback vendor
    return {
      id: 0,
      symbol: safeString(backendVendor.symbol, 'UNKNOWN'),
      name: safeString(backendVendor.name, 'Unknown Vendor'),
      industry: 'Materials',
      vendorType: 'Materials Supplier',
      marketCap: 0,
      revenue: 0,
      profitMargin: 0,
      peRatio: 0,
      riskLevel: 'medium',
      quarterlyRevenue: [],
      weekHigh52: 0,
      weekLow52: 0,
      lastUpdated: new Date().toISOString(),
      currentPrice: 0,
      stockPrice: 0,
      riskScore: 50,
      financialHealth: 50,
      marketStability: 50,
      growthProspects: 50,
      beta: 1,
      roe: 0,
      debtToEquity: 0,
    };
  }
};

/**
 * Map array of backend vendors to frontend format
 */
export const mapBackendVendorsToFrontend = (backendVendors: BackendVendor[]): VendorData[] => {
  return backendVendors.map(mapBackendVendorToFrontend);
};