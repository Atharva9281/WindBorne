import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', height = 'h-4', width = 'w-full', rounded = false }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-muted ${rounded ? 'rounded-full' : 'rounded'} ${height} ${width} ${className}`}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="dashboard-card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8" rounded />
        <Skeleton className="w-12 h-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-32 h-3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 8 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-4" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="dashboard-card p-6">
      <div className="mb-4 space-y-2">
        <Skeleton className="w-48 h-5" />
        <Skeleton className="w-64 h-3" />
      </div>
      <div className="h-80 flex items-end justify-between space-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1" 
            height={`h-${Math.floor(Math.random() * 40) + 20}`}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-center space-x-6">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="w-80 h-8" />
        <Skeleton className="w-96 h-4" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Table */}
      <div className="dashboard-card p-6">
        <div className="mb-4">
          <Skeleton className="w-64 h-6 mb-2" />
          <Skeleton className="w-80 h-4" />
        </div>
        <TableSkeleton rows={5} columns={10} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function ProgressiveLoader({ 
  progress, 
  total, 
  message 
}: { 
  progress: number; 
  total: number; 
  message: string; 
}) {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-64">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{message}</span>
          <span>{progress}/{total}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm font-medium">
          {percentage}% complete
        </div>
      </div>
      
      <div className="text-center text-muted-foreground">
        <p className="text-sm">Loading comprehensive financial data...</p>
        <p className="text-xs mt-1">Fetching from 3 Alpha Vantage endpoints per vendor</p>
      </div>
    </div>
  );
}