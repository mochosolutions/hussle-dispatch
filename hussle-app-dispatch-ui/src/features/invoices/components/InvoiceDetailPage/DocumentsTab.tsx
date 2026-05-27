import { useCallback, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { CloudUploadOutlined, FilePdfOutlined } from '@ant-design/icons';
import SectionCard from 'components/SectionCard';
import { Body, BodyMuted, BodyStrong } from 'components/Typography';
import { useDispatch } from 'store';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { DocumentTable } from '../../../documents/components/DocumentTable';
import {
  generateInvoicePdf,
  downloadInvoicePdfUrl,
} from 'utils/api/invoices/invoiceApi';
import { fetchInvoiceDetailsRequest } from '../../store/reducers';
import type { InvoiceDetail } from '../../types';

interface DocumentsTabProps {
  invoice: InvoiceDetail;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ invoice }) => {
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const [isGenerating, setIsGenerating] = useState(false);

  const hasPdf = invoice.pdfUrl !== null && invoice.pdfUrl !== undefined && invoice.pdfUrl !== '';
  const downloadUrl = downloadInvoicePdfUrl(invoice.id);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateInvoicePdf(invoice.id);
      dispatch(fetchInvoiceDetailsRequest({ id: invoice.id }));
      dispatch(
        notify({
          message: hasPdf ? 'Invoice PDF regenerated' : 'Invoice PDF generated',
          variant: 'success',
        }),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate invoice PDF';
      dispatch(notify({ message, variant: 'error' }));
    } finally {
      setIsGenerating(false);
    }
  }, [dispatch, hasPdf, invoice.id]);

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'invoice-detail',
      entityType: 'invoice',
      entityId: invoice.id,
    });
  }, [openDrawer, invoice.id]);

  return (
    <Stack spacing={2}>
      <SectionCard title="Invoice PDF" contentSX={{ p: 2 }}>
        {hasPdf ? (
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FilePdfOutlined style={{ fontSize: 24 }} />
            <Box>
              <BodyStrong>{`Invoice_${invoice.invoiceNumber}.pdf`}</BodyStrong>
              <BodyMuted>Generated invoice PDF</BodyMuted>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              component="a"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View / Download
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Regenerating…' : 'Re-generate'}
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FilePdfOutlined style={{ fontSize: 24, opacity: 0.4 }} />
            <Box>
              <Body>Invoice PDF not yet generated</Body>
              <BodyMuted>The PDF will be generated automatically on send.</BodyMuted>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="contained"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating…' : 'Generate PDF'}
            </Button>
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        title="Invoice Documents"
        contentSX={{ p: 0 }}
        actions={
          <Button
            size="small"
            startIcon={<CloudUploadOutlined />}
            variant="outlined"
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        }
      >
        <DocumentTable
          entityType="invoice"
          entityId={invoice.id}
          onUpload={handleUploadClick}
        />
      </SectionCard>

      {invoice.load !== null && (
        <SectionCard title={`From Load ${invoice.load.loadNumber}`} contentSX={{ p: 0 }}>
          <DocumentTable entityType="load" entityId={invoice.load.id} />
        </SectionCard>
      )}
    </Stack>
  );
};
