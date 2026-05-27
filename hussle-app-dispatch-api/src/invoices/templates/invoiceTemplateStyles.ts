// ---------------------------------------------------------------------------
// CSS styles for the invoice PDF template (injected into <style> block)
// ---------------------------------------------------------------------------

export const invoiceTemplateStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    line-height: 1.5;
  }

  .invoice-container { padding: 40px; max-width: 800px; margin: 0 auto; }

  .header {
    background: #1A2332;
    color: #ffffff;
    padding: 24px 32px;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left h1 { font-size: 28px; font-weight: 700; color: #60A5FA; }
  .header-left .invoice-number { font-size: 14px; color: #94a3b8; margin-top: 4px; }
  .header-right { text-align: right; font-size: 11px; color: #cbd5e1; }
  .header-right .company-name { font-size: 16px; font-weight: 600; color: #ffffff; }

  .route-bar {
    background: #1E2A3A;
    color: #ffffff;
    padding: 16px 32px;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  .route-bar .route-label { color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .route-bar .route-value { font-weight: 600; margin-top: 2px; }

  .body { padding: 24px 32px; }

  .billing-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .billing-box { flex: 1; }
  .billing-box h3 { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px; }
  .billing-box p { font-size: 12px; line-height: 1.6; }

  .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 6px; }
  .detail-item label { font-size: 10px; text-transform: uppercase; color: #6b7280; display: block; }
  .detail-item span { font-size: 13px; font-weight: 500; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  td.amount { text-align: right; font-weight: 500; }
  th.amount { text-align: right; }

  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
  .totals-row.total { border-top: 2px solid #1A2332; padding-top: 12px; font-size: 16px; font-weight: 700; }

  .noa-section {
    border: 2px solid #DC2626;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 24px;
  }
  .noa-section h3 { color: #DC2626; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .noa-section p { font-size: 11px; line-height: 1.6; white-space: pre-wrap; }

  .notes { background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
  .notes h3 { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
  .notes p { font-size: 11px; }

  .footer { text-align: center; font-size: 10px; color: #9ca3af; padding-top: 16px; border-top: 1px solid #e5e7eb; }
`;
