import type { IftaReportResult } from '../../types/iftaTypes';

export interface IftaReportResponse {
  year: number;
  quarter: number;
  periodStart: string;
  periodEnd: string;
  vehicles: IftaReportResult['vehicles'];
  fleetTotals: IftaReportResult['fleetTotals'];
}

export const toIftaReportResponse = (result: IftaReportResult): IftaReportResponse => ({
  year: result.year,
  quarter: result.quarter,
  periodStart: result.periodStart,
  periodEnd: result.periodEnd,
  vehicles: result.vehicles,
  fleetTotals: result.fleetTotals,
});
