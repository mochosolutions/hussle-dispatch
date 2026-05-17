// ---------------------------------------------------------------------------
// UploadStep — renders one UploadZone per document declared by the step.
//
// Behavior (US-20 AC-20):
//   - Reads `step.documents[]` (the documentsPhase declares a single COI slot).
//   - Local state tracks per-document status: empty | uploading | uploaded | error.
//   - On file select, dispatches `uploadDocument({ documentType, file })` and
//     marks the slot 'uploading'.
//   - Observes the slice-level `upload` loading state. When it transitions from
//     'pending' → 'success', the in-flight slot becomes 'uploaded'.
//   - When ALL required documents are 'uploaded', dispatches `submitStep` to
//     auto-advance — once.
//
// The actual S3 PUT is owned by `uploadDocumentSaga` (US-15); this component
// only initiates and observes status.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { PageTitle, BodyMuted } from 'components/Typography';

import type { DocumentSlot, Step } from 'features/carrier-portal-v2/engine';
import UploadZone from 'features/carrier-portal-v2/components/UploadZone';
import type { UploadZoneState } from 'features/carrier-portal-v2/components/UploadZone';
import UploadDropArea from 'features/carrier-portal-v2/components/UploadDropArea';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface UploadStepProps {
  step: Step;
}

const UploadStep: React.FC<UploadStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const uploadStatus = useSelector(selectLoading('upload'));

  const documents: DocumentSlot[] = step.documents ?? [];

  const [zoneStates, setZoneStates] = useState<Record<string, UploadZoneState>>(() => {
    const initial: Record<string, UploadZoneState> = {};
    for (const doc of documents) {
      initial[doc.id] = 'empty';
    }
    return initial;
  });

  const inFlightDocId = useRef<string | null>(null);
  const prevUploadStatus = useRef(uploadStatus);
  const advanceDispatched = useRef(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Observe upload loading transitions and update the in-flight slot.
  useEffect(() => {
    if (prevUploadStatus.current === 'pending' && uploadStatus === 'success') {
      const docId = inFlightDocId.current;
      if (docId) {
        setZoneStates((prev) => ({ ...prev, [docId]: 'uploaded' }));
        inFlightDocId.current = null;
      }
    } else if (prevUploadStatus.current === 'pending' && uploadStatus === 'failure') {
      const docId = inFlightDocId.current;
      if (docId) {
        setZoneStates((prev) => ({ ...prev, [docId]: 'error' }));
        inFlightDocId.current = null;
      }
    }
    prevUploadStatus.current = uploadStatus;
  }, [uploadStatus]);

  // Auto-advance once when every required document is uploaded.
  useEffect(() => {
    if (advanceDispatched.current) {
      return;
    }
    const requiredDocs = documents.filter((d) => d.required);
    if (requiredDocs.length === 0) {
      return;
    }
    const allUploaded = requiredDocs.every((d) => zoneStates[d.id] === 'uploaded');
    if (allUploaded) {
      advanceDispatched.current = true;
      dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: step.id,
          answers: { documentsCompleted: true },
        }),
      );
    }
  }, [zoneStates, documents, dispatch, step.id]);

  if (!session) {
    return null;
  }

  const handleFileSelected = (doc: DocumentSlot, file: File): void => {
    inFlightDocId.current = doc.id;
    setZoneStates((prev) => ({ ...prev, [doc.id]: 'uploading' }));
    dispatch(
      carrierPortalV2Actions.uploadDocument({
        documentType: doc.id.toUpperCase(),
        file,
      }),
    );
  };

  const handleChooseClick = (docId: string): void => {
    fileInputs.current[docId]?.click();
  };

  const handleInputChange =
    (doc: DocumentSlot) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelected(doc, file);
      }
      // Reset so re-selecting the same file re-fires onChange.
      event.target.value = '';
    };

  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      {step.title ? <PageTitle sx={{ mb: 1 }}>{step.title}</PageTitle> : null}
      {step.subtitle ? <BodyMuted sx={{ mb: 3 }}>{step.subtitle}</BodyMuted> : null}

      <Stack spacing={2}>
        {documents.map((doc, index) => {
          const state = zoneStates[doc.id] ?? 'empty';
          return (
            <UploadZone
              key={doc.id}
              state={state}
              zoneNumber={index + 1}
              name={doc.label}
              tag={
                doc.required
                  ? { label: 'Required', variant: 'required' }
                  : { label: 'Optional', variant: 'optional' }
              }
            >
              <input
                ref={(node) => {
                  fileInputs.current[doc.id] = node;
                }}
                type="file"
                aria-label={`Upload ${doc.label}`}
                onChange={handleInputChange(doc)}
                style={{ display: 'none' }}
              />
              <UploadDropArea
                title={state === 'uploaded' ? 'File uploaded' : 'Drop a file or click to upload'}
                subtitle={state === 'uploaded' ? undefined : 'PDF, JPG, or PNG'}
                icon={<CloudUploadOutlined />}
                onClick={() => handleChooseClick(doc.id)}
                actions={
                  state === 'empty' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleChooseClick(doc.id);
                      }}
                    >
                      Choose file
                    </Button>
                  ) : null
                }
              />
            </UploadZone>
          );
        })}
      </Stack>
    </Box>
  );
};

export default UploadStep;
