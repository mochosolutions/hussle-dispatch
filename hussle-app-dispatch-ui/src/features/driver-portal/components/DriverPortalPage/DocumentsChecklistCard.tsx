import { useCallback, useMemo, useRef } from 'react';
import { Box, Card, CardContent, Stack } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { Meta, MetaStrong, SectionLabel } from 'components/Typography';
import { FileUploadRow } from 'components/FileUploadRow';
import { DocumentType } from 'features/documents/types';
import {
  getDocumentDownloadUrl,
  type DriverPortalDocument,
} from 'utils/api/driver-portal/driverPortalApi';
import { uploadDriverDocumentRequest } from '../../store/reducers/driverPortalPageSlice';
import { selectDriverPortalDocUploads } from '../../store/selectors/driverPortalSelectors';
import { POD_UPLOAD_STATUSES } from '../../loadStatus';

interface DocumentsChecklistCardProps {
  loadId: string;
  loadStatus: string;
  documents: DriverPortalDocument[];
}

interface DocSpec {
  type: DocumentType;
  label: string;
}

type RowStatus = 'idle' | 'uploading' | 'done' | 'error';

// Backend accepts pdf/png/jpeg only.
const ACCEPT = 'image/jpeg,image/png,application/pdf';

const OPTIONAL_DOCS: DocSpec[] = [
  { type: DocumentType.LUMPER_RECEIPT, label: 'Lumper Receipt' },
  { type: DocumentType.SCALE_TICKET, label: 'Scale Ticket' },
  { type: DocumentType.FUEL_RECEIPT, label: 'Fuel Receipt' },
  { type: DocumentType.OTHER, label: 'Other' },
];

const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 1,
      overflow: 'hidden',
      '& > *:last-of-type': { borderBottom: 'none' },
    }}
  >
    {children}
  </Box>
);

// Maps already-uploaded document types to their most recent document id so a
// "done" row can offer View (signed GET URL) and Replace.
const buildDocIdByType = (documents: DriverPortalDocument[]): Record<string, string> => {
  const byType: Record<string, string> = {};
  documents.forEach((doc) => {
    byType[doc.type] = doc.id;
  });
  return byType;
};

// Document upload list matching the portal mock. Upload state now flows through
// the driver-portal upload saga (presign → PUT → confirm → refetch); the per-row
// status is read from the page slice. Already-uploaded types render as "done"
// (seeded from the server documents list) and expose Replace + View.
export const DocumentsChecklistCard: React.FC<DocumentsChecklistCardProps> = ({
  loadId,
  loadStatus,
  documents,
}) => {
  const dispatch = useDispatch();
  const uploadStatuses = useSelector(selectDriverPortalDocUploads);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTypeRef = useRef<DocumentType | null>(null);

  const docIdByType = useMemo(() => buildDocIdByType(documents), [documents]);
  const uploadedTypes = useMemo(
    () => new Set(documents.map((doc) => doc.type)),
    [documents],
  );

  const requiredDocs: DocSpec[] = [
    { type: DocumentType.BOL_SIGNED, label: 'Bill of Lading (BOL)' },
    ...(POD_UPLOAD_STATUSES.has(loadStatus)
      ? [{ type: DocumentType.POD, label: 'Proof of Delivery (POD)' }]
      : []),
  ];

  // Effective row status: explicit session upload state wins; otherwise a type
  // already present on the server renders as done.
  const rowStatusFor = useCallback(
    (type: DocumentType): RowStatus => {
      const sessionStatus = uploadStatuses[type];
      if (sessionStatus) {
        return sessionStatus;
      }
      return uploadedTypes.has(type) ? 'done' : 'idle';
    },
    [uploadStatuses, uploadedTypes],
  );

  const handleUploadClick = useCallback((type: DocumentType) => {
    activeTypeRef.current = type;
    fileInputRef.current?.click();
  }, []);

  const handleView = useCallback(
    (type: DocumentType) => {
      const documentId = docIdByType[type];
      if (documentId) {
        window.open(getDocumentDownloadUrl(documentId), '_blank', 'noopener,noreferrer');
      }
    },
    [docIdByType],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      const type = activeTypeRef.current;
      if (!file || !type) {
        return;
      }
      dispatch(uploadDriverDocumentRequest({ loadId, file, docType: type }));
    },
    [dispatch, loadId],
  );

  const renderRow = (doc: DocSpec, required: boolean) => {
    const status = rowStatusFor(doc.type);
    return (
      <FileUploadRow
        key={doc.type}
        label={doc.label}
        required={required}
        file={null}
        status={status}
        onUpload={() => handleUploadClick(doc.type)}
        onRemove={() => handleUploadClick(doc.type)}
        onReplace={() => handleUploadClick(doc.type)}
        onView={docIdByType[doc.type] ? () => handleView(doc.type) : undefined}
      />
    );
  };

  const requiredDone = requiredDocs.filter((doc) => rowStatusFor(doc.type) === 'done').length;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <MetaStrong sx={{ color: 'text.primary' }}>Documents to upload</MetaStrong>
          <Meta>
            {requiredDone}/{requiredDocs.length} done
          </Meta>
        </Stack>

        <Group>{requiredDocs.map((doc) => renderRow(doc, true))}</Group>

        <SectionLabel sx={{ display: 'block', mt: 2, mb: 1 }}>Optional</SectionLabel>
        <Group>{OPTIONAL_DOCS.map((doc) => renderRow(doc, false))}</Group>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentsChecklistCard;
