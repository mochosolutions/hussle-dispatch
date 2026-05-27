import React from 'react';
import type { InvoiceTemplateData } from '../types/invoiceTemplateTypes';
import { APP_NAME } from '@/shared/constants/app';

interface InvoicePdfTemplateProps {
  data: InvoiceTemplateData;
}

const formatRoute = (stops: InvoiceTemplateData['stops']): { origin: string; destination: string } => {
  const pickups = stops.filter((s) => s.type === 'PICKUP');
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');
  const first = pickups[0];
  const last = deliveries[deliveries.length - 1];

  const formatLocation = (stop: typeof first): string => {
    if (stop === undefined) return '—';
    const parts = [stop.city, stop.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (stop.facilityName ?? '—');
  };

  return { origin: formatLocation(first), destination: formatLocation(last) };
};

export const InvoicePdfTemplate: React.FC<InvoicePdfTemplateProps> = ({ data }) => {
  const route = formatRoute(data.stops);

  return (
    <div className="invoice-container">
      <div className="header">
        <div className="header-left">
          <h1>INVOICE</h1>
          <div className="invoice-number">#{data.invoiceNumber}</div>
        </div>
        <div className="header-right">
          <div className="company-name">{data.carrierName}</div>
          {data.carrierAddress !== null && <div>{data.carrierAddress}</div>}
          {data.carrierCityStateZip !== null && <div>{data.carrierCityStateZip}</div>}
          {data.carrierPhone !== null && <div>{data.carrierPhone}</div>}
          {data.carrierEmail !== null && <div>{data.carrierEmail}</div>}
          {data.carrierMcNumber !== null && <div>MC# {data.carrierMcNumber}</div>}
        </div>
      </div>

      <div className="route-bar">
        <div>
          <div className="route-label">Origin</div>
          <div className="route-value">{route.origin}</div>
        </div>
        <div>
          <div className="route-label">Destination</div>
          <div className="route-value">{route.destination}</div>
        </div>
        <div>
          <div className="route-label">Load #</div>
          <div className="route-value">{data.loadNumber}</div>
        </div>
        {data.totalMiles !== null && (
          <div>
            <div className="route-label">Miles</div>
            <div className="route-value">{data.totalMiles.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="body">
        <div className="billing-row">
          <div className="billing-box">
            <h3>Bill To</h3>
            <p>
              <strong>{data.billToName}</strong>
              {data.billToAddress !== null && <><br />{data.billToAddress}</>}
              {data.billToCityStateZip !== null && <><br />{data.billToCityStateZip}</>}
              {data.billToEmail !== null && <><br />{data.billToEmail}</>}
            </p>
          </div>
          <div className="billing-box" style={{ textAlign: 'right' }}>
            <h3>Invoice Details</h3>
            <p>
              <strong>Date:</strong> {data.invoiceDate}<br />
              <strong>Due:</strong> {data.dueDate}<br />
              <strong>Terms:</strong> {data.paymentTerms}
            </p>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-item">
            <label>Load Number</label>
            <span>{data.loadNumber}</span>
          </div>
          {data.externalRefNumber !== null && (
            <div className="detail-item">
              <label>Reference #</label>
              <span>{data.externalRefNumber}</span>
            </div>
          )}
          {data.equipmentType !== null && (
            <div className="detail-item">
              <label>Equipment</label>
              <span>{data.equipmentType}</span>
            </div>
          )}
          {data.commodity !== null && (
            <div className="detail-item">
              <label>Commodity</label>
              <span>{data.commodity}</span>
            </div>
          )}
          {data.weight !== null && (
            <div className="detail-item">
              <label>Weight</label>
              <span>{data.weight.toLocaleString()} lbs</span>
            </div>
          )}
        </div>

        {data.stops.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Stop</th>
                <th>Location</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.stops.map((stop, idx) => (
                <tr key={idx}>
                  <td>{stop.type}</td>
                  <td>
                    {stop.facilityName !== null && <strong>{stop.facilityName} — </strong>}
                    {[stop.city, stop.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>{stop.appointmentStart ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Line Haul — Load #{data.loadNumber}</td>
              <td className="amount">${data.subtotal}</td>
            </tr>
            {data.accessorials.map((acc, idx) => (
              <tr key={idx}>
                <td>{acc.type}{acc.description !== null ? ` — ${acc.description}` : ''}</td>
                <td className="amount">${acc.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-box">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>${data.subtotal}</span>
            </div>
            {data.accessorials.length > 0 && (
              <div className="totals-row">
                <span>Accessorials</span>
                <span>${data.accessorialsTotal}</span>
              </div>
            )}
            <div className="totals-row total">
              <span>Total Due</span>
              <span>${data.totalAmount}</span>
            </div>
          </div>
        </div>

        {data.factoringNoa !== null && (
          <div className="noa-section">
            <h3>Notice of Assignment (NOA)</h3>
            <p>{data.factoringNoa}</p>
          </div>
        )}

        {data.factoringAdvance !== null && (
          <div className="details-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="detail-item">
              <label>Advance Amount</label>
              <span>${data.factoringAdvance}</span>
            </div>
            {data.factoringFeeAmount !== null && (
              <div className="detail-item">
                <label>Factoring Fee</label>
                <span>${data.factoringFeeAmount}</span>
              </div>
            )}
            {data.reserveAmount !== null && (
              <div className="detail-item">
                <label>Reserve</label>
                <span>${data.reserveAmount}</span>
              </div>
            )}
          </div>
        )}

        {data.notes !== null && (
          <div className="notes">
            <h3>Notes</h3>
            <p>{data.notes}</p>
          </div>
        )}

        <div className="footer">
          Generated by {APP_NAME}
        </div>
      </div>
    </div>
  );
};
