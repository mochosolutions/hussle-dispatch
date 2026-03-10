import type { LoadHistoryItem, LoadPerformanceMetrics } from '@/shared/loadQueries';

export interface LoadHistoryItemResponse {
  id: string;
  loadNumber: string;
  status: string;
  customerRate: string | null;
  carrierRate: string | null;
  ratePerMile: string | null;
  totalMiles: number | null;
  loadedMiles: number | null;
  createdAt: string;
  updatedAt: string;
}

export const toLoadHistoryItemResponse = (item: LoadHistoryItem): LoadHistoryItemResponse => ({
  id: item.id,
  loadNumber: item.loadNumber,
  status: item.status,
  customerRate: item.customerRate !== null ? item.customerRate.toFixed(2) : null,
  carrierRate: item.carrierRate !== null ? item.carrierRate.toFixed(2) : null,
  ratePerMile: item.ratePerMile !== null ? item.ratePerMile.toFixed(2) : null,
  totalMiles: item.totalMiles,
  loadedMiles: item.loadedMiles,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export const toLoadHistoryListResponse = (
  items: LoadHistoryItem[],
): LoadHistoryItemResponse[] => items.map(toLoadHistoryItemResponse);

export const toLoadPerformanceMetricsResponse = (
  metrics: LoadPerformanceMetrics,
): LoadPerformanceMetrics => ({
  totalLoads: metrics.totalLoads,
  totalRevenue: metrics.totalRevenue,
  avgRatePerMile: metrics.avgRatePerMile,
  onTimePercent: metrics.onTimePercent,
});
