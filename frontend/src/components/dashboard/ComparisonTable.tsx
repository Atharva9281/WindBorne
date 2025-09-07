import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Download, Filter, X } from 'lucide-react';
import { VendorData, formatCurrency, formatPercentage, formatPERatio, getRiskBadgeClass, getVendorTypeBadgeClass } from '@/data/mockVendorData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ComparisonTableProps {
  vendors: VendorData[];
  onExportRow: (vendor: VendorData) => void;
  onViewDetails: (symbol: string) => void;
}

type SortField = keyof VendorData;
type SortOrder = 'asc' | 'desc';

interface FilterState {
  vendorType: string;
  riskLevel: string;
  industry: string;
  marketCapMin: string;
  marketCapMax: string;
  profitMarginMin: string;
  profitMarginMax: string;
  search: string;
}

export function ComparisonTable({ vendors, onExportRow, onViewDetails }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Simplified filters
  const [filterType, setFilterType] = useState('all'); // 'all', 'sensors', 'materials'
  const [filterRisk, setFilterRisk] = useState('all'); // 'all', 'low', 'medium', 'high'
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort vendors with simplified logic
  const filteredAndSortedVendors = useMemo(() => {
    let filtered = vendors.filter(vendor => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          vendor.name.toLowerCase().includes(searchLower) ||
          vendor.symbol.toLowerCase().includes(searchLower) ||
          vendor.industry.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter (Sensors vs Materials)
      if (filterType !== 'all') {
        const typeMatch = 
          (filterType === 'sensors' && vendor.industry === 'Sensors') ||
          (filterType === 'materials' && (vendor.industry === 'Materials' || vendor.industry === 'Plastics'));
        if (!typeMatch) return false;
      }

      // Risk level filter
      if (filterRisk !== 'all' && vendor.riskLevel !== filterRisk) {
        return false;
      }

      return true;
    });

    // Sort filtered results
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [vendors, filterType, filterRisk, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearAllFilters = () => {
    setFilterType('all');
    setFilterRisk('all');
    setSearchTerm('');
  };

  const activeFilterCount = [filterType, filterRisk, searchTerm].filter(value => value !== '' && value !== 'all').length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Vendor Comparison</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedVendors.length} of {vendors.length} vendors
              {activeFilterCount > 0 && ` (${activeFilterCount} filters applied)`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Simple dropdown filters */}
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sensors">Sensors</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Removed complex filter panel - using simple dropdowns above instead */}
      {false && (
        <div className="px-6 py-4 bg-slate-50 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
              <Input
                placeholder="Company, symbol, industry..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="h-8"
              />
            </div>

            {/* Vendor Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Vendor Type</label>
              <Select value={filters.vendorType} onValueChange={(value) => updateFilter('vendorType', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="Sensor Supplier">Sensor Supplier</SelectItem>
                  <SelectItem value="Materials Supplier">Materials Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Risk Level</label>
              <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Industry */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Industry</label>
              <Select value={filters.industry} onValueChange={(value) => updateFilter('industry', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All industries</SelectItem>
                  <SelectItem value="Sensors">Sensors</SelectItem>
                  <SelectItem value="Plastics">Plastics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Market Cap Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Market Cap (B)</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  value={filters.marketCapMin}
                  onChange={(e) => updateFilter('marketCapMin', e.target.value)}
                  className="h-8"
                  type="number"
                />
                <Input
                  placeholder="Max"
                  value={filters.marketCapMax}
                  onChange={(e) => updateFilter('marketCapMax', e.target.value)}
                  className="h-8"
                  type="number"
                />
              </div>
            </div>

            {/* Profit Margin Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Profit Margin (%)</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  value={filters.profitMarginMin}
                  onChange={(e) => updateFilter('profitMarginMin', e.target.value)}
                  className="h-8"
                  type="number"
                />
                <Input
                  placeholder="Max"
                  value={filters.profitMarginMax}
                  onChange={(e) => updateFilter('profitMarginMax', e.target.value)}
                  className="h-8"
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-[80vh] overflow-y-auto border-t border-border custom-scrollbar">
        <table className="w-full table-fixed">
          <thead>
            <tr className="table-header">
              <th className="px-3 py-4 text-left w-[20%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  <span className="font-semibold text-foreground text-sm">Company</span>
                  <SortIcon field="name" />
                </Button>
              </th>
              <th className="px-2 py-4 text-center w-[10%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('vendorType')}
                >
                  <span className="font-semibold text-foreground text-sm">Type</span>
                  <SortIcon field="vendorType" />
                </Button>
              </th>
              <th className="px-2 py-4 text-right w-[8%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('marketCap')}
                >
                  <span className="font-semibold text-foreground text-sm">Mkt Cap</span>
                  <SortIcon field="marketCap" />
                </Button>
              </th>
              <th className="px-2 py-4 text-right w-[8%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('revenue')}
                >
                  <span className="font-semibold text-foreground text-sm">Revenue</span>
                  <SortIcon field="revenue" />
                </Button>
              </th>
              <th className="px-2 py-4 text-right w-[8%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('profitMargin')}
                >
                  <span className="font-semibold text-foreground text-sm">Profit %</span>
                  <SortIcon field="profitMargin" />
                </Button>
              </th>
              <th className="px-2 py-4 text-right w-[7%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('peRatio')}
                >
                  <span className="font-semibold text-foreground text-sm">P/E</span>
                  <SortIcon field="peRatio" />
                </Button>
              </th>
              <th className="px-2 py-4 text-right w-[7%]">
                <span className="font-semibold text-foreground text-sm">D/E</span>
              </th>
              <th className="px-2 py-4 text-right w-[7%]">
                <span className="font-semibold text-foreground text-sm">Current</span>
              </th>
              <th className="px-2 py-4 text-right w-[7%]">
                <span className="font-semibold text-foreground text-sm">Cash $</span>
              </th>
              <th className="px-2 py-4 text-center w-[8%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('riskLevel')}
                >
                  <span className="font-semibold text-foreground text-sm">Risk</span>
                  <SortIcon field="riskLevel" />
                </Button>
              </th>
              <th className="px-2 py-4 text-center w-[7%]">
                <span className="font-semibold text-foreground text-sm">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedVendors.map((vendor) => (
              <tr key={vendor.symbol} className="table-row">
                <td className="px-3 py-4">
                  <div>
                    <div className="font-semibold text-foreground text-sm truncate">{vendor.name}</div>
                    <div className="text-xs text-primary font-medium">{vendor.symbol}</div>
                  </div>
                </td>
                <td className="px-2 py-4 text-center">
                  <Badge className={`${getVendorTypeBadgeClass(vendor.vendorType)} text-xs font-medium whitespace-nowrap`}>
                    {vendor.vendorType === 'Sensor Supplier' ? 'Sensor' : 'Materials'}
                  </Badge>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className="font-semibold text-foreground text-sm">{formatCurrency(vendor.marketCap)}</span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className="font-semibold text-foreground text-sm">{formatCurrency(vendor.revenue)}</span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className={`font-semibold text-sm ${
                    vendor.profitMargin > 10 ? 'metric-positive' : 
                    vendor.profitMargin > 5 ? 'metric-neutral' : 
                    'metric-negative'
                  }`}>
                    {formatPercentage(vendor.profitMargin)}
                  </span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className="font-semibold text-foreground text-sm">
                    {formatPERatio(vendor.peRatio)}
                  </span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className={`font-semibold text-sm ${
                    (vendor.financialRatios?.debt_to_equity || 0) < 0.6 ? 'text-green-600' : 
                    (vendor.financialRatios?.debt_to_equity || 0) > 1.0 ? 'text-red-600' : 
                    'text-foreground'
                  }`}>
                    {vendor.financialRatios?.debt_to_equity ? vendor.financialRatios.debt_to_equity.toFixed(2) : 'N/A'}
                  </span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className={`font-semibold text-sm ${
                    (vendor.financialRatios?.current_ratio || 0) > 1.2 ? 'text-green-600' : 
                    (vendor.financialRatios?.current_ratio || 0) < 1.0 ? 'text-red-600' : 
                    'text-foreground'
                  }`}>
                    {vendor.financialRatios?.current_ratio ? vendor.financialRatios.current_ratio.toFixed(2) : 'N/A'}
                  </span>
                </td>
                <td className="px-2 py-4 text-right">
                  <span className="font-semibold text-foreground text-sm">
                    {vendor.balanceSheet?.cash_and_cash_equivalents ? 
                      `$${(vendor.balanceSheet.cash_and_cash_equivalents / 1000000000).toFixed(1)}B` : 'N/A'}
                  </span>
                </td>
                <td className="px-2 py-4 text-center">
                  <Badge className={`${getRiskBadgeClass(vendor.riskLevel)} text-xs font-medium`}>
                    {vendor.riskLevel.charAt(0).toUpperCase() + vendor.riskLevel.slice(1)}
                  </Badge>
                </td>
                <td className="px-2 py-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border border-border">
                      <DropdownMenuItem 
                        onClick={() => onViewDetails(vendor.symbol)}
                        className="hover:bg-accent cursor-pointer"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onExportRow(vendor)}
                        className="hover:bg-accent cursor-pointer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Row
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}