import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  lastUpdated: string;
  isLoading?: boolean;
}

export function DashboardHeader({ 
  onRefresh, 
  onExport, 
  lastUpdated, 
  isLoading = false 
}: DashboardHeaderProps) {

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="bg-card/95 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">WindBorne Systems</h1>
                <p className="text-sm text-muted-foreground">Vendor Comparison Dashboard</p>
              </div>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-4">
            {/* Last Updated */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{formatLastUpdated(lastUpdated)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="border-border hover:bg-accent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="border-border hover:bg-accent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}