import { useMemo, useCallback } from 'react';
import type { FormikProps } from 'formik';
import { Typography } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { DocumentPicker } from 'components/DocumentPicker';
import type { QueuedDocument } from 'components/DocumentPicker';
import { DOC_TYPE_CONFIG } from 'features/documents/constants';
import type { LoadFormValues } from '../../../../../validators/loadSchema';
import { CREATE_LOAD_DOC_CARD_CONFIG } from '../../../../../constants';

export const DocumentsSection: React.FC<{ formik: FormikProps<LoadFormValues> }> = ({ formik }) => {
  const queuedDocuments = useMemo(
    () => (formik.values.queuedDocuments ?? []) as QueuedDocument[],
    [formik.values.queuedDocuments],
  );

  const docCount = queuedDocuments.length;

  const handleAdd = useCallback(
    (newDoc: QueuedDocument) => {
      const config = DOC_TYPE_CONFIG[newDoc.documentType];
      let updated: QueuedDocument[];

      if (config.onePer) {
        updated = queuedDocuments.filter((d) => d.documentType !== newDoc.documentType);
      } else {
        updated = [...queuedDocuments];
      }

      void formik.setFieldValue('queuedDocuments', [...updated, newDoc]);
    },
    [formik, queuedDocuments],
  );

  const handleRemove = useCallback(
    (clientId: string) => {
      void formik.setFieldValue(
        'queuedDocuments',
        queuedDocuments.filter((d) => d.clientId !== clientId),
      );
    },
    [formik, queuedDocuments],
  );

  return (
    <SectionCard
      title="Load Documents"
      subheader="Attach rate confirmation, BOL, or other documents"
      actions={
        <Typography variant="body2" color="text.secondary">
          {docCount} document{docCount !== 1 ? 's' : ''}
        </Typography>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Attach documents at load creation. BOL, weight tickets and POD can be added once the load
        is in progress.
      </Typography>

      <DocumentPicker
        documents={queuedDocuments}
        onAdd={handleAdd}
        onRemove={handleRemove}
        docTypes={CREATE_LOAD_DOC_CARD_CONFIG}
      />
    </SectionCard>
  );
};
