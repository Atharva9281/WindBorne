import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Database, TrendingUp, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface PerformanceIndicatorProps {
  loadTime?: number;
  vendorCount?: number;
  lastUpdated?: string;
}

interface CacheMetrics {
  cache_freshness_percentage: number;
  total_cached_items: number;
  average_cache_age_hours: number;
  optimization_needed: boolean;
}

export function PerformanceIndicator({ 
  loadTime = 0, 
  vendorCount = 0, 
  lastUpdated 
}: PerformanceIndicatorProps) {
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    fetchCacheMetrics();
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchCacheMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCacheMetrics = async () => {
    try {
      const response = await api.getCacheStatus();
      setCacheMetrics(response.cache_metrics);
    } catch (error) {
      console.warn('Failed to fetch cache metrics:', error);
    }
  };

  const handleOptimizeCache = async () => {
    setIsOptimizing(true);
    try {
      await api.optimizeCache();
      await fetchCacheMetrics();
    } catch (error) {
      console.error('Cache optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getPerformanceScore = () => {
    if (!cacheMetrics) return { score: 75, level: 'Good' };
    
    let score = 100;
    
    // Penalize low cache freshness
    if (cacheMetrics.cache_freshness_percentage < 80) {
      score -= (80 - cacheMetrics.cache_freshness_percentage);
    }
    
    // Penalize old cache
    if (cacheMetrics.average_cache_age_hours > 12) {
      score -= Math.min(30, (cacheMetrics.average_cache_age_hours - 12) * 2);
    }
    
    // Bonus for good load time
    if (loadTime > 0 && loadTime < 5) {
      score += 5;
    } else if (loadTime > 10) {
      score -= Math.min(20, (loadTime - 10));
    }

    const level = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
    
    return { score: Math.max(0, Math.min(100, Math.round(score))), level };
  };

  const performance = getPerformanceScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="dashboard-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Performance Status</h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full border ${getScoreColor(performance.score)}`}>
          <span className="text-sm font-medium">
            {performance.score}/100 ({performance.level})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Load Time */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">
            {loadTime > 0 ? `${loadTime.toFixed(1)}s` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Load Time</div>
        </div>

        {/* Data Freshness */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Database className="h-4 w-4 text-muted-foreground mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">
            {cacheMetrics ? `${cacheMetrics.cache_freshness_percentage.toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Cache Fresh</div>
        </div>

        {/* Vendor Count */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="h-4 w-4 text-muted-foreground mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">
            {vendorCount}
          </div>
          <div className="text-xs text-muted-foreground">Vendors</div>
        </div>

        {/* Cache Age */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <RefreshCw className="h-4 w-4 text-muted-foreground mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">
            {cacheMetrics ? `${cacheMetrics.average_cache_age_hours.toFixed(0)}h` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Avg Age</div>
        </div>
      </div>

      {/* Optimization Actions */}
      {cacheMetrics?.optimization_needed && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Optimization Available
              </Badge>
              <span className="text-sm text-yellow-700">
                Cache performance can be improved
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimizeCache}
              disabled={isOptimizing}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Optimize
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}