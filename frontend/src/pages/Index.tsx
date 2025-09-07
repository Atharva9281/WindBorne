import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICards } from '@/components/dashboard/KPICards';
import { ComparisonTable } from '@/components/dashboard/ComparisonTable';
import { FinancialAnalysisSection } from '@/components/dashboard/FinancialAnalysisSection';
import { FinancialRecommendations } from '@/components/dashboard/FinancialRecommendations';
import { RiskAnalysisPanel } from '@/components/dashboard/RiskAnalysisPanel';
import { ExportControls } from '@/components/dashboard/ExportControls';
import { VendorDetailModal } from '@/components/dashboard/VendorDetailModal';
import { PerformanceIndicator } from '@/components/dashboard/PerformanceIndicator';
import { VendorData, mapBackendVendorsToFrontend } from '@/data/mockVendorData';
import { useToast } from '@/hooks/use-toast';
import { DashboardSkeleton, ProgressiveLoader } from '@/components/ui/skeleton-loader';
import api, { KPIsResponse } from '@/services/api';

const Index = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [kpis, setKpis] = useState<KPIsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ progress: 0, total: 1, message: 'Initializing...' });
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [loadTime, setLoadTime] = useState<number>(0);
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set up automatic cache optimization after initial load
    const optimizeInterval = setInterval(async () => {
      try {
        const cacheStatus = await api.getCacheStatus();
        if (cacheStatus.cache_metrics?.optimization_needed) {
          console.log('Triggering automatic cache optimization...');
          await api.optimizeCache();
        }
      } catch (error) {
        console.warn('Background cache optimization failed:', error);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    return () => clearInterval(optimizeInterval);
  }, []);

  const loadData = async () => {
    const startTime = Date.now();
    setLoadStartTime(startTime);
    
    try {
      setIsLoading(true);
      setError(null);
      setLoadingProgress({ progress: 0, total: 2, message: 'Starting data fetch...' });
      
      console.log('Loading vendor data and KPIs...');
      
      // Load vendors with progress tracking
      setLoadingProgress({ progress: 0, total: 2, message: 'Fetching vendor data from Alpha Vantage...' });
      const backendVendors = await api.fetchVendors((progress, total, message) => {
        setLoadingProgress({ progress, total: 2, message });
      });
      
      // Load KPIs
      setLoadingProgress({ progress: 1, total: 2, message: 'Loading portfolio KPIs...' });
      const kpisData = await api.fetchKPIs();
      
      // Map backend data to frontend format
      setLoadingProgress({ progress: 2, total: 2, message: 'Processing vendor data...' });
      const mappedVendors = mapBackendVendorsToFrontend(backendVendors);
      
      setVendors(mappedVendors);
      setKpis(kpisData);
      
      // Background prefetch for frequently accessed vendor details
      setTimeout(async () => {
        try {
          const highValueVendors = mappedVendors
            .filter(v => v.marketCap > 10) // Only large cap vendors
            .slice(0, 3) // Top 3 vendors
            .map(v => v.symbol);
          
          if (highValueVendors.length > 0) {
            await api.preloadVendorData(highValueVendors);
            console.log('Prefetched data for high-value vendors:', highValueVendors);
          }
        } catch (error) {
          console.warn('Background prefetch failed:', error);
        }
      }, 2000); // Wait 2 seconds after main load
      
      // Calculate load time
      const endTime = Date.now();
      const totalLoadTime = (endTime - startTime) / 1000;
      setLoadTime(totalLoadTime);
      
      toast({
        title: "Data Loaded Successfully",
        description: `Loaded ${mappedVendors.length} vendors with comprehensive Alpha Vantage data in ${totalLoadTime.toFixed(1)}s.`,
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      
      toast({
        title: "Error Loading Data",
        description: "Failed to load vendor data from the API. Please check if the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('Refreshing vendor data...');
      
      // Reload all data
      const [backendVendors, kpisData] = await Promise.all([
        api.fetchVendors(),
        api.fetchKPIs()
      ]);
      
      // Map backend data to frontend format
      const mappedVendors = mapBackendVendorsToFrontend(backendVendors);
      
      setVendors(mappedVendors);
      setKpis(kpisData);
      setError(null);
      
      toast({
        title: "Data Refreshed",
        description: "Vendor data has been updated with the latest information from Alpha Vantage.",
      });
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
      
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh vendor data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      console.log('Exporting CSV from API...');
      
      // Download CSV from API
      const blob = await api.exportCSV();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `windborne-vendors-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Vendor data has been exported to CSV from the API.",
      });
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      
      // Enhanced fallback to local CSV generation with balance sheet data
      const headers = [
        'Company', 'Symbol', 'Industry', 'Vendor Type', 'Market Cap (B)', 'Revenue (B)', 
        'Profit Margin (%)', 'P/E Ratio', 'Debt-to-Equity', 'Current Ratio', 'Cash Position (B)', 
        'Financial Health', 'Market Stability', 'Growth Prospects', 'Financial Stability', 
        'Overall Risk Score', 'Risk Level', 'Last Updated'
      ];
      const csvContent = [
        headers.join(','),
        ...vendors.map(vendor => [
          `"${vendor.name}"`,
          vendor.symbol,
          vendor.industry,
          vendor.vendorType,
          vendor.marketCap.toFixed(1),
          vendor.revenue.toFixed(1),
          vendor.profitMargin.toFixed(1),
          vendor.peRatio ? vendor.peRatio.toFixed(1) : 'N/A',
          vendor.financialRatios?.debt_to_equity ? vendor.financialRatios.debt_to_equity.toFixed(2) : 'N/A',
          vendor.financialRatios?.current_ratio ? vendor.financialRatios.current_ratio.toFixed(2) : 'N/A',
          vendor.balanceSheet?.cash_and_cash_equivalents ? (vendor.balanceSheet.cash_and_cash_equivalents / 1000000000).toFixed(2) : 'N/A',
          vendor.riskScores?.financial_health || vendor.financialHealth || 'N/A',
          vendor.riskScores?.market_stability || vendor.marketStability || 'N/A',
          vendor.riskScores?.growth_prospects || vendor.growthProspects || 'N/A',
          vendor.riskScores?.financial_stability || vendor.financialStability || 'N/A',
          vendor.riskScores?.risk_score || vendor.riskScore || 'N/A',
          vendor.riskLevel,
          vendor.lastUpdated || new Date().toISOString()
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `windborne-vendors-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete (Fallback)",
        description: "API export failed, but vendor data has been exported using local data.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (symbol: string) => {
    const vendor = vendors.find(v => v.symbol === symbol);
    if (vendor) {
      setSelectedVendor(vendor);
      setIsModalOpen(true);
    }
  };

  const handleExportRow = (vendor: VendorData) => {
    const csvContent = [
      'Company,Symbol,Industry,Market Cap (B),Revenue (B),Profit Margin (%),P/E Ratio,Risk Level',
      [
        `"${vendor.name}"`,
        vendor.symbol,
        vendor.industry,
        vendor.marketCap.toFixed(1),
        vendor.revenue.toFixed(1),
        vendor.profitMargin.toFixed(1),
        vendor.peRatio.toFixed(1),
        vendor.riskLevel
      ].join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${vendor.symbol}-details.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Row Exported",
      description: `${vendor.name} data has been exported.`,
    });
  };

  const lastUpdated = vendors[0]?.lastUpdated || new Date().toISOString();

  if (error && vendors.length === 0) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white">
          <DashboardHeader
            onRefresh={handleRefresh}
            onExport={handleExport}
            lastUpdated={lastUpdated}
            isLoading={isRefreshing}
          />
          <main className="container mx-auto px-6 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Data</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </main>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white">
        <DashboardHeader
          onRefresh={handleRefresh}
          onExport={handleExport}
          lastUpdated={lastUpdated}
          isLoading={isLoading || isRefreshing}
        />

        <main className="container mx-auto px-6 py-8 space-y-8">
          {isLoading ? (
            <div className="space-y-8">
              <ProgressiveLoader 
                progress={loadingProgress.progress} 
                total={loadingProgress.total} 
                message={loadingProgress.message} 
              />
              <DashboardSkeleton />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <KPICards vendors={vendors} kpis={kpis} />

              {/* Comparison Table */}
              <section>
                <ComparisonTable
                  vendors={vendors}
                  onExportRow={handleExportRow}
                  onViewDetails={handleViewDetails}
                />
              </section>

              {/* Charts Section */}
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Financial Analysis</h2>
                  <p className="text-muted-foreground">Visual representation of vendor performance and market position</p>
                </div>
                <FinancialAnalysisSection vendors={vendors} />
              </section>

              {/* Financial Recommendations */}
              <section>
                <FinancialRecommendations vendors={vendors} />
              </section>

              {/* Risk Analysis and Export Controls */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RiskAnalysisPanel vendors={vendors} />
                <ExportControls vendors={vendors} />
              </section>
            </>
          )}
        </main>

        {/* Vendor Detail Modal */}
        <VendorDetailModal
          vendor={selectedVendor}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVendor(null);
          }}
        />
      </div>
    </ThemeProvider>
  );
};

export default Index;
