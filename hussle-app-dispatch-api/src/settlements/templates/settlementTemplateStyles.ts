// ---------------------------------------------------------------------------
// CSS styles for the settlement PDF template (injected into <style> block)
// ---------------------------------------------------------------------------

export const settlementStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    color: #333333;
    line-height: 1.5;
  }

  .settlement-container { max-width: 800px; margin: 0 auto; padding: 40px; }

  /* Header */
  .header {
    background: #1A2332;
    color: #ffffff;
    padding: 24px 32px;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left h1 { font-size: 24px; font-weight: 700; color: #60A5FA; margin: 0; }
  .header-left .settlement-number { font-size: 14px; color: #94a3b8; margin-top: 4px; }
  .header-right { text-align: right; font-size: 11px; color: #cbd5e1; }
  .header-right .carrier-name { font-size: 16px; font-weight: 600; color: #ffffff; }
  .header-right .period-dates { margin-top: 4px; }

  /* Info bar */
  .info-bar {
    background: #1E2A3A;
    color: #ffffff;
    padding: 16px 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 12px;
  }

  .info-bar .info-label {
    color: #94a3b8;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-bar .info-value { font-weight: 600; margin-top: 2px; }
  .info-bar .info-group { display: flex; gap: 24px; }
  .info-bar .info-group-right { display: flex; gap: 24px; justify-content: flex-end; }

  /* Section titles */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #1A2332;
    border-bottom: 2px solid #1A2332;
    padding-bottom: 6px;
    margin-top: 28px;
    margin-bottom: 12px;
  }

  /* Shared table styles */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th {
    background: #f1f5f9;
    padding: 8px 12px;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    color: #475569;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0;
  }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  tr:nth-child(even) td { background: #fafbfc; }
  th.amount, td.amount { text-align: right; }
  td.amount { font-weight: 500; }

  /* Totals section */
  .totals-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 28px;
    margin-bottom: 24px;
  }

  .totals-box { width: 320px; }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
  }

  .totals-row.subtotal {
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    margin-top: 4px;
  }

  .totals-row.net-earnings {
    border-top: 2px solid #1A2332;
    padding-top: 12px;
    margin-top: 8px;
    font-size: 16px;
    font-weight: 700;
  }

  /* Metrics row */
  .metrics-row {
    display: flex;
    justify-content: center;
    gap: 48px;
    margin-top: 24px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 6px;
  }

  .metric-item { text-align: center; }
  .metric-label {
    font-size: 10px;
    text-transform: uppercase;
    color: #6b7280;
    letter-spacing: 0.5px;
  }
  .metric-value { font-size: 16px; font-weight: 600; margin-top: 4px; }

  /* Footer */
  .footer {
    text-align: center;
    font-size: 10px;
    color: #9ca3af;
    padding-top: 16px;
    margin-top: 24px;
    border-top: 1px solid #e5e7eb;
  }
`;
