// Import API configuration
import { API_BASE, apiRequest } from '../config/api.js';

// Types based on backend response format
export interface BackendVendor {
  id: number;
  name: string;
  symbol: string;
  vendorType: 'Sensor Supplier' | 'Materials Supplier';
  industry: string;
  marketCap: number;
  profitMargin: number;
  revenue: number;
  weekHigh52: number;
  weekLow52: number;
  currentPrice: number;
  risk: 'low' | 'medium' | 'high';
  riskScore: number;
  financialHealth: number;
  marketStability: number;
  growthProspects: number;
  peRatio: number;
  beta: number;
  roe: number;
  debtToEquity: number;
  lastUpdated: string;
  quarterlyRevenue?: number[]; // Optional quarterly data
}

export interface VendorsResponse {
  vendors: BackendVendor[];
}

export interface KPIsResponse {
  totalPortfolioValue: string;
  avgProfitMargin: string;
  activeVendors: number;
  avgRiskScore: number;
  highRiskVendors: number;
  topPerformingVendor: string;
}

export interface VendorDetailResponse {
  symbol: string;
  name: string;
  industry: string;
  vendorType: string;
  marketCap: number;
  revenue: number;
  profitMargin: number;
  peRatio: number;
  beta: number;
  roe: number;
  debtToEquity: number;
  weekHigh52: number;
  weekLow52: number;
  quarterlyRevenue: number[];
  riskScores: {
    financialHealth: number;
    marketStability: number;
    growthProspects: number;
    riskScore: number;
    overall: string;
  };
  lastUpdated: string;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`API Error: ${response.status} ${response.statusText} - ${errorText}`, response.status);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('Failed to parse JSON response');
  }
};

export const api = {
  /**
   * Fetch all vendors from the backend API with detailed data including quarterly revenue
   */
  fetchVendors: async (onProgress?: (progress: number, total: number, message: string) => void): Promise<BackendVendor[]> => {
    try {
      console.log('Fetching vendors from API...');
      onProgress?.(0, 1, 'Initiating data fetch from Alpha Vantage...');
      
      const response = await fetch(`${API_BASE}/vendors`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<VendorsResponse>(response);
      console.log('Vendors fetched successfully:', data.vendors.length, 'vendors');
      onProgress?.(1, 1, `Successfully loaded ${data.vendors.length} vendors with comprehensive financial data`);
      
      return data.vendors;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  /**
   * Fetch portfolio KPIs from the backend API
   */
  fetchKPIs: async (): Promise<KPIsResponse> => {
    try {
      console.log('Fetching KPIs from API...');
      const response = await fetch(`${API_BASE}/portfolio/kpis`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<KPIsResponse>(response);
      console.log('KPIs fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  },

  /**
   * Fetch detailed information for a specific vendor
   */
  fetchVendorDetail: async (symbol: string): Promise<VendorDetailResponse> => {
    try {
      console.log(`Fetching vendor detail for ${symbol}...`);
      const response = await fetch(`${API_BASE}/vendors/${symbol}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<VendorDetailResponse>(response);
      console.log(`Vendor detail for ${symbol} fetched successfully:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching vendor detail for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Refresh cached data for a specific vendor
   */
  refreshVendor: async (symbol: string): Promise<any> => {
    try {
      console.log(`Refreshing vendor data for ${symbol}...`);
      const response = await fetch(`${API_BASE}/vendors/${symbol}/refresh`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<any>(response);
      console.log(`Vendor data for ${symbol} refreshed successfully:`, data);
      return data;
    } catch (error) {
      console.error(`Error refreshing vendor data for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Export vendors data as CSV
   */
  exportCSV: async (): Promise<Blob> => {
    try {
      console.log('Exporting CSV...');
      const response = await fetch(`${API_BASE}/export/csv`, {
        headers: {
          'Accept': 'text/csv',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(`Export failed: ${response.status} ${response.statusText} - ${errorText}`, response.status);
      }
      
      const blob = await response.blob();
      console.log('CSV export completed successfully');
      return blob;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  },

  /**
   * Get cache status and optimization metrics
   */
  getCacheStatus: async (): Promise<any> => {
    try {
      console.log('Fetching cache status...');
      const response = await fetch(`${API_BASE}/cache/status`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<any>(response);
      console.log('Cache status fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching cache status:', error);
      throw error;
    }
  },

  /**
   * Optimize cache performance
   */
  optimizeCache: async (): Promise<any> => {
    try {
      console.log('Triggering cache optimization...');
      const response = await fetch(`${API_BASE}/cache/optimize`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<any>(response);
      console.log('Cache optimization initiated:', data);
      return data;
    } catch (error) {
      console.error('Error optimizing cache:', error);
      throw error;
    }
  },

  /**
   * Preload data for specific vendors
   */
  preloadVendorData: async (symbols: string[]): Promise<any> => {
    try {
      console.log('Preloading vendor data for:', symbols);
      const response = await fetch(`${API_BASE}/cache/preload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symbols),
      });
      
      const data = await handleResponse<any>(response);
      console.log('Vendor data preloading initiated:', data);
      return data;
    } catch (error) {
      console.error('Error preloading vendor data:', error);
      throw error;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpiredCache: async (): Promise<any> => {
    try {
      console.log('Clearing expired cache entries...');
      const response = await fetch(`${API_BASE}/cache/clear-expired`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await handleResponse<any>(response);
      console.log('Expired cache cleared:', data);
      return data;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      throw error;
    }
  },
};

export default api;