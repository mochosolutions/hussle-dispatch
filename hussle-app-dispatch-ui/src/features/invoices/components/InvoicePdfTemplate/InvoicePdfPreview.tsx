import { useState, useEffect, useCallback } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import type { InvoiceData } from '../../types';
import { generateInvoicePdf } from './generateInvoicePdf';

interface InvoicePdfPreviewProps {
  invoice: InvoiceData;
  width?: string | number;
  height?: string | number;
}

/**
 * Renders an inline PDF preview using an iframe.
 * Generates the PDF blob on mount and whenever invoice data changes.
 */
const InvoicePdfPreview: React.FC<InvoicePdfPreviewProps> = ({
  invoice,
  width = '100%',
  height = 600,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generatePreview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const blob = await generateInvoicePdf(invoice);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return url;
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate PDF preview';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [invoice]);

  useEffect(() => {
    generatePreview();

    return () => {
      setPdfUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    };
  }, [generatePreview]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width,
          height,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width,
          height,
        }}
      >
        <Typography color="error">{errorMessage}</Typography>
      </Box>
    );
  }

  if (!pdfUrl) {
    return null;
  }

  return (
    <Box sx={{ width, height }}>
      <iframe
        src={pdfUrl}
        title={`Invoice ${invoice.invoiceNumber} Preview`}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </Box>
  );
};

export { InvoicePdfPreview };
export type { InvoicePdfPreviewProps };
