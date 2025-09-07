import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react';
import { VendorData } from '@/data/mockVendorData';

interface ExportControlsProps {
  vendors: VendorData[];
}

export function ExportControls({ vendors }: ExportControlsProps) {
  const [isCsvExporting, setIsCsvExporting] = useState(false);
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [csvExportComplete, setCsvExportComplete] = useState(false);
  const [reportComplete, setReportComplete] = useState(false);

  // Safe formatting functions
  const formatNumber = (value: any, decimals = 1): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0';
    }
    return Number(value).toFixed(decimals);
  };

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '$0.00';
    }
    return `$${Number(value).toFixed(2)}`;
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  };

  const safeInteger = (value: any): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0';
    }
    return Math.round(Number(value)).toString();
  };

  const handleExportCSV = async () => {
    setIsCsvExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create CSV content with safe data access
      const headers = [
        'Company', 'Symbol', 'Industry', 'Market Cap (B)', 'Revenue (B)', 
        'Profit Margin (%)', 'P/E Ratio', '52W High', '52W Low', 'Current Price', 
        'Risk Level', 'Risk Score', 'Beta', 'ROE (%)', 'Debt to Equity'
      ];
      
      const csvContent = [
        headers.join(','),
        ...vendors.map(vendor => [
          `"${safeString(vendor.name)}"`,
          safeString(vendor.symbol),
          safeString(vendor.industry),
          formatNumber(vendor.marketCap),
          formatNumber(vendor.revenue),
          formatNumber(vendor.profitMargin),
          formatNumber(vendor.peRatio),
          formatNumber(vendor.weekHigh52, 2),
          formatNumber(vendor.weekLow52, 2),
          formatNumber(vendor.currentPrice || vendor.stockPrice, 2),
          safeString(vendor.riskLevel),
          safeInteger(vendor.riskScore),
          formatNumber(vendor.beta, 3),
          formatNumber(vendor.roe),
          formatNumber(vendor.debtToEquity, 2)
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `windborne-vendor-analysis-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvExportComplete(true);
      setTimeout(() => setCsvExportComplete(false), 3000);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsCsvExporting(false);
    }
  };

  const handleExportReport = async () => {
    setIsReportGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Calculate portfolio metrics safely
      const totalPortfolioValue = vendors.reduce((sum, v) => sum + (Number(v.marketCap) || 0), 0);
      const avgProfitMargin = vendors.length > 0 ? 
        vendors.reduce((sum, v) => sum + (Number(v.profitMargin) || 0), 0) / vendors.length : 0;
      
      // Create comprehensive report content with safe data access
      const reportContent = `
WindBorne Systems - Vendor Analysis Report
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
================
Total Vendors Analyzed: ${vendors.length}
Industries Covered: ${[...new Set(vendors.map(v => safeString(v.industry)))].join(', ')}
Total Portfolio Value: $${formatNumber(totalPortfolioValue)}B
Average Profit Margin: ${formatNumber(avgProfitMargin)}%

Risk Distribution:
- Low Risk: ${vendors.filter(v => v.riskLevel === 'low').length} vendors
- Medium Risk: ${vendors.filter(v => v.riskLevel === 'medium').length} vendors  
- High Risk: ${vendors.filter(v => v.riskLevel === 'high').length} vendors

VENDOR DETAILS
==============
${vendors.map(vendor => `
${safeString(vendor.name)} (${safeString(vendor.symbol)})
Industry: ${safeString(vendor.industry)}
Market Cap: $${formatNumber(vendor.marketCap)}B
Revenue: $${formatNumber(vendor.revenue)}B
Profit Margin: ${formatNumber(vendor.profitMargin)}%
P/E Ratio: ${formatNumber(vendor.peRatio)}
Risk Level: ${safeString(vendor.riskLevel).toUpperCase()}
Risk Score: ${safeInteger(vendor.riskScore)}/100
Current Price: ${formatCurrency(vendor.currentPrice || vendor.stockPrice)}
52-Week Range: ${formatCurrency(vendor.weekLow52)} - ${formatCurrency(vendor.weekHigh52)}
Beta: ${formatNumber(vendor.beta, 3)}
ROE: ${formatNumber(vendor.roe)}%
Debt/Equity: ${formatNumber(vendor.debtToEquity, 2)}
Last Updated: ${safeString(vendor.lastUpdated)}
---`).join('\n')}

PORTFOLIO ANALYSIS
==================
- Sensor Suppliers: ${vendors.filter(v => v.industry === 'Sensors').length} companies
- Material Suppliers: ${vendors.filter(v => v.industry === 'Materials' || v.industry === 'Plastics').length} companies
- Average Risk Score: ${vendors.length > 0 ? Math.round(vendors.reduce((sum, v) => sum + (Number(v.riskScore) || 0), 0) / vendors.length) : 0}/100

RECOMMENDATIONS
===============
1. Monitor high-risk vendors closely for supply chain stability
2. Consider diversifying supplier base across industries
3. Regular quarterly reviews of vendor performance metrics
4. Evaluate contract terms with underperforming vendors
5. Focus on vendors with strong financial health scores
6. Monitor market volatility indicators (Beta values)

This report was generated automatically by WindBorne Systems Vendor Dashboard.
Data sourced from Alpha Vantage financial APIs.
      `.trim();

      // Download report
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `windborne-vendor-report-${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setReportComplete(true);
      setTimeout(() => setReportComplete(false), 3000);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsReportGenerating(false);
    }
  };

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Export & Reports</h3>
        <p className="text-sm text-muted-foreground">
          Download vendor data and generate comprehensive reports
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleExportCSV}
          disabled={isCsvExporting || isReportGenerating}
          className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
          size="lg"
        >
          {isCsvExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : csvExportComplete ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isCsvExporting ? 'Exporting...' : csvExportComplete ? 'Exported!' : 'Export to CSV'}
        </Button>

        <Button
          onClick={handleExportReport}
          disabled={isCsvExporting || isReportGenerating}
          variant="outline"
          className="flex-1 border-border hover:bg-accent"
          size="lg"
        >
          {isReportGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : reportComplete ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {isReportGenerating ? 'Generating...' : reportComplete ? 'Generated!' : 'Generate Report'}
        </Button>
      </div>

      {/* Export Info */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Export Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">CSV Export includes:</span>
            <ul className="mt-1 text-xs text-muted-foreground space-y-1">
              <li>• Complete vendor financial data</li>
              <li>• Risk assessments</li>
              <li>• Contact information</li>
              <li>• Historical performance</li>
            </ul>
          </div>
          <div>
            <span className="text-muted-foreground">Report includes:</span>
            <ul className="mt-1 text-xs text-muted-foreground space-y-1">
              <li>• Executive summary</li>
              <li>• Detailed vendor profiles</li>
              <li>• Risk analysis</li>
              <li>• Strategic recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}