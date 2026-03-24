import React from 'react';
import { Chip } from '@mui/material';

interface InvoiceReadinessBadgeProps {
  readiness: string;
}

const READINESS_CONFIG: Record<string, { label: string; color: 'warning' | 'success' | 'info' }> = {
  AWAITING_DOCUMENTS: { label: 'Missing Docs', color: 'warning' },
  READY: { label: 'Invoice Ready', color: 'success' },
  INVOICE_CREATED: { label: 'Invoiced', color: 'info' },
};

export const InvoiceReadinessBadge: React.FC<InvoiceReadinessBadgeProps> = ({ readiness }) => {
  const config = READINESS_CONFIG[readiness];

  if (!config) {
    return null;
  }

  return <Chip label={config.label} color={config.color} size="small" />;
};
