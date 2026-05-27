import React from 'react';
import { APP_NAME } from '@/shared/constants/app';

export interface SettlementTemplateData {
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  carrierName: string;
  driverName: string | null;
  vehicleUnit: string | null;
  revenueItems: {
    loadNumber: string;
    route: string;
    miles: number | null;
    deliveryDate: string;
    amount: string;
  }[];
  dispatchFeeItems: {
    description: string;
    amount: string;
  }[];
  driverPayItems: {
    description: string;
    amount: string;
  }[];
  expenseItems: {
    description: string;
    date: string;
    amount: string;
  }[];
  accessorialItems: {
    description: string;
    amount: string;
  }[];
  adjustmentItems: {
    description: string;
    date: string;
    amount: string;
  }[];
  grossRevenue: string;
  dispatchFeeTotal: string;
  driverPayTotal: string;
  expensesTotal: string;
  accessorialsTotal: string;
  adjustmentsTotal: string;
  netEarnings: string;
  totalMiles: number;
  revenuePerMile: string | null;
  costPerMile: string | null;
  netPerMile: string | null;
}

const hasDeductions = (data: SettlementTemplateData): boolean =>
  data.dispatchFeeItems.length > 0 ||
  data.driverPayItems.length > 0 ||
  data.expenseItems.length > 0;

const hasMetrics = (data: SettlementTemplateData): boolean =>
  data.revenuePerMile !== null || data.costPerMile !== null || data.netPerMile !== null;

export const SettlementPdfTemplate: React.FC<{ data: SettlementTemplateData }> = ({ data }) => (
  <div className="settlement-container">
    {/* Header */}
    <div className="header">
      <div className="header-left">
        <h1>SETTLEMENT STATEMENT</h1>
        <div className="settlement-number">#{data.settlementNumber}</div>
      </div>
      <div className="header-right">
        <div className="carrier-name">{data.carrierName}</div>
        <div className="period-dates">
          {data.periodStart} — {data.periodEnd}
        </div>
      </div>
    </div>

    {/* Info bar */}
    <div className="info-bar">
      <div className="info-group">
        {data.driverName !== null && (
          <div>
            <div className="info-label">Driver</div>
            <div className="info-value">{data.driverName}</div>
          </div>
        )}
        {data.vehicleUnit !== null && (
          <div>
            <div className="info-label">Vehicle</div>
            <div className="info-value">{data.vehicleUnit}</div>
          </div>
        )}
      </div>
      <div className="info-group-right">
        <div>
          <div className="info-label">Period</div>
          <div className="info-value">
            {data.periodStart} — {data.periodEnd}
          </div>
        </div>
        <div>
          <div className="info-label">Settlement #</div>
          <div className="info-value">{data.settlementNumber}</div>
        </div>
      </div>
    </div>

    {/* Revenue section */}
    {data.revenueItems.length > 0 && (
      <>
        <div className="section-title">Revenue</div>
        <table>
          <thead>
            <tr>
              <th>Load #</th>
              <th>Route</th>
              <th className="amount">Miles</th>
              <th>Delivered</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.loadNumber}</td>
                <td>{item.route}</td>
                <td className="amount">{item.miles !== null ? item.miles.toLocaleString() : '—'}</td>
                <td>{item.deliveryDate}</td>
                <td className="amount">${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* Deductions section */}
    {hasDeductions(data) && (
      <>
        <div className="section-title">Deductions</div>

        {data.dispatchFeeItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Dispatch Fees</th>
                <th className="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.dispatchFeeItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.description}</td>
                  <td className="amount">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data.driverPayItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Driver Pay</th>
                <th className="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.driverPayItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.description}</td>
                  <td className="amount">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data.expenseItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Expenses</th>
                <th>Date</th>
                <th className="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.expenseItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.description}</td>
                  <td>{item.date}</td>
                  <td className="amount">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    )}

    {/* Accessorials section */}
    {data.accessorialItems.length > 0 && (
      <>
        <div className="section-title">Accessorials</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.accessorialItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td className="amount">${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* Adjustments section */}
    {data.adjustmentItems.length > 0 && (
      <>
        <div className="section-title">Adjustments</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.adjustmentItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td>{item.date}</td>
                <td className="amount">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {/* Totals section */}
    <div className="totals-section">
      <div className="totals-box">
        <div className="totals-row">
          <span>Gross Revenue</span>
          <span>${data.grossRevenue}</span>
        </div>
        {data.dispatchFeeItems.length > 0 && (
          <div className="totals-row">
            <span>Dispatch Fees</span>
            <span>(${data.dispatchFeeTotal})</span>
          </div>
        )}
        {data.driverPayItems.length > 0 && (
          <div className="totals-row">
            <span>Driver Pay</span>
            <span>${data.driverPayTotal}</span>
          </div>
        )}
        {data.expenseItems.length > 0 && (
          <div className="totals-row">
            <span>Expenses</span>
            <span>(${data.expensesTotal})</span>
          </div>
        )}
        {data.accessorialItems.length > 0 && (
          <div className="totals-row">
            <span>Accessorials</span>
            <span>${data.accessorialsTotal}</span>
          </div>
        )}
        {data.adjustmentItems.length > 0 && (
          <div className="totals-row">
            <span>Adjustments</span>
            <span>{data.adjustmentsTotal}</span>
          </div>
        )}
        <div className="totals-row subtotal">
          <span>Total Miles</span>
          <span>{data.totalMiles.toLocaleString()}</span>
        </div>
        <div className="totals-row net-earnings">
          <span>Net Earnings</span>
          <span>${data.netEarnings}</span>
        </div>
      </div>
    </div>

    {/* Per-mile metrics */}
    {hasMetrics(data) && (
      <div className="metrics-row">
        {data.revenuePerMile !== null && (
          <div className="metric-item">
            <div className="metric-label">Rev / Mi</div>
            <div className="metric-value">${data.revenuePerMile}</div>
          </div>
        )}
        {data.costPerMile !== null && (
          <div className="metric-item">
            <div className="metric-label">Cost / Mi</div>
            <div className="metric-value">${data.costPerMile}</div>
          </div>
        )}
        {data.netPerMile !== null && (
          <div className="metric-item">
            <div className="metric-label">Net / Mi</div>
            <div className="metric-value">${data.netPerMile}</div>
          </div>
        )}
      </div>
    )}

    <div className="footer">Generated by {APP_NAME}</div>
  </div>
);
