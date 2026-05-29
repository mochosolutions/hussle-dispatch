import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { createLoad } from 'utils/api/loads/loadApi';
import {
  presignDocument,
  uploadDocumentToS3,
  confirmDocument,
} from 'utils/api/documents/documentApi';
import { createContact } from 'utils/api/fleet/contactApi';
import { acceptImportRequest } from 'features/ratecon-imports/store/reducers';
import type { CreateLoadInput, DispatchBlocker, QueuedDocument } from '../../types';
import {
  createLoadSuccess,
  createLoadFailure,
  fetchLoadsRequest,
  setCreateBlockers,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

interface CreateLoadPayload {
  data: CreateLoadInput;
  queuedDocuments: QueuedDocument[];
  rateconImportId?: string;
}

function* uploadQueuedDocuments(loadId: string, documents: QueuedDocument[]) {
  let failed = 0;
  for (const doc of documents) {
    try {
      const { presign } = (yield call(presignDocument, {
        fileName: doc.file.name,
        fileSize: doc.file.size,
        mimeType: doc.file.type,
        type: doc.documentType,
        entityType: 'load' as const,
        entityId: loadId,
      })) as SagaReturnType<typeof presignDocument>;

      yield call(uploadDocumentToS3, presign.presignedUrl, doc.file);
      yield call(confirmDocument, presign.documentId);
    } catch {
      failed += 1;
    }
  }
  return failed;
}

export function* createLoadSaga(action: PayloadAction<CreateLoadPayload>): Generator {
  try {
    const { data, queuedDocuments } = action.payload;

    const response = (yield call(createLoad, data)) as SagaReturnType<typeof createLoad>;
    const { data: load, warnings } = response;

    // Upload queued documents after load creation
    let docsFailed = 0;
    if (queuedDocuments.length > 0) {
      docsFailed = (yield* uploadQueuedDocuments(load.id, queuedDocuments)) as number;
    }

    yield put(loadActions.addOne(load));
    yield put(createLoadSuccess({}));

    // Link the originating rate-con import to this load (re-points the PDF document,
    // marks the import ACCEPTED, drops it from the inbox).
    if (action.payload.rateconImportId !== undefined) {
      yield put(
        acceptImportRequest({ importId: action.payload.rateconImportId, loadId: load.id }),
      );
    }

    // Surface non-blocking geocoding warnings
    for (const warning of warnings) {
      yield put(notify({ message: warning.message, variant: 'warning' }));
    }

    // Auto-save new contacts (have contactName but no contactId)
    const newContacts = data.stops
      .filter((stop) => stop.contactName && !stop.contactId)
      .reduce<{ firstName: string; lastName: string; phone?: string; customerId?: string }[]>(
        (acc, stop) => {
          const name = stop.contactName?.trim();
          if (!name) return acc;
          // Deduplicate by full name
          if (acc.some((c) => `${c.firstName} ${c.lastName}`.trim() === name)) return acc;
          const parts = name.split(' ');
          const firstName = parts[0] ?? name;
          const lastName = parts.slice(1).join(' ') || '';
          acc.push({
            firstName,
            lastName,
            phone: stop.contactPhone ?? undefined,
            customerId: data.customerId ?? undefined,
          });
          return acc;
        },
        [],
      );

    if (newContacts.length > 0) {
      let saved = 0;
      for (const contact of newContacts) {
        try {
          yield call(createContact, contact);
          saved += 1;
        } catch {
          // Silently skip — don't block load creation flow
        }
      }
      if (saved > 0) {
        yield put(notify({ message: `${String(saved)} new contact${saved > 1 ? 's' : ''} saved`, variant: 'info' }));
      }
    }

    const isDraft = data.status === 'QUOTED';

    if (docsFailed > 0) {
      yield put(notify({ message: `Load created. ${String(docsFailed)} document(s) failed to upload — retry from load detail page.`, variant: 'warning' }));
    } else {
      yield put(notify({ message: isDraft ? 'Draft saved' : 'Load created', variant: 'success' }));
    }

    if (!isDraft) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, `/loads/${load.id}?showRateConPrompt=true`);
    }

    yield put(fetchLoadsRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    let errorMessage = 'Failed to create load';
    let blockers: DispatchBlocker[] = [];

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Extract API validation errors + structured dispatch blockers from Axios response
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const resp = (
        error as {
          response?: {
            data?: { errors?: { message: string }[]; blockers?: DispatchBlocker[] };
          };
        }
      ).response;
      const apiErrors = resp?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        errorMessage = apiErrors.map((e) => e.message).join('. ');
      }
      const apiBlockers = resp?.data?.blockers;
      if (Array.isArray(apiBlockers)) {
        blockers = apiBlockers;
      }
    }

    yield put(createLoadFailure({ error: errorMessage }));
    yield put(setCreateBlockers(blockers));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
