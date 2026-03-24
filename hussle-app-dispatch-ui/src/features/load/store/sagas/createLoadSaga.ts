import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createLoad } from 'utils/api/loads/loadApi';
import { presignDocument, uploadDocumentToS3, confirmDocument } from 'utils/api/documents/documentApi';
import type { CreateLoadInput, LoadListItem, QueuedDocument } from '../../types';
import {
  createLoadSuccess,
  createLoadFailure,
  fetchLoadsRequest,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

interface CreateLoadPayload {
  data: CreateLoadInput;
  queuedDocuments: QueuedDocument[];
}

function* uploadQueuedDocuments(loadId: string, documents: QueuedDocument[]) {
  let failed = 0;
  for (const doc of documents) {
    try {
      const { presign } = (yield call(presignDocument, {
        fileName: doc.file.name,
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

export function* createLoadSaga(
  action: PayloadAction<CreateLoadPayload>,
): Generator {
  try {
    const { data, queuedDocuments } = action.payload;

    const load = (yield call(createLoad, data)) as SagaReturnType<typeof createLoad>;

    // Upload queued documents after load creation
    let docsFailed = 0;
    if (queuedDocuments.length > 0) {
      docsFailed = (yield* uploadQueuedDocuments(load.id, queuedDocuments)) as number;
    }

    // Map detail to list item for entity store
    const origin = (load.stops ?? []).find((s) => s.type === 'PICKUP');
    const deliveries = (load.stops ?? []).filter((s) => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];

    const loadListItem: LoadListItem = {
      id: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      equipmentType: load.equipmentType,
      commodity: load.commodity,
      customerRate: load.customerRate,
      carrierRate: load.carrierRate,
      totalMiles: load.totalMiles,
      ratePerMile: load.ratePerMile,
      carrierId: load.carrierId,
      carrierName: load.carrier?.name ?? null,
      driverId: load.driverId,
      driverName: load.driver
        ? `${load.driver.firstName} ${load.driver.lastName}`
        : null,
      customerName: load.customer?.companyName ?? null,
      contactName: load.contact
        ? `${load.contact.firstName} ${load.contact.lastName}`.trim()
        : null,
      contactEmail: load.contact?.email ?? null,
      contactPhone: load.contact?.phone ?? null,
      originCity: origin?.city ?? null,
      originState: origin?.state ?? null,
      destinationCity: lastDelivery?.city ?? null,
      destinationState: lastDelivery?.state ?? null,
      accessorialChargeCount: load.accessorialCharges.length,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
    };

    yield put(loadActions.addOne(loadListItem));
    yield put(createLoadSuccess({}));

    const isDraft = data.status === 'QUOTED';

    if (docsFailed > 0) {
      yield call(
        enqueueSnackbar,
        `Load created. ${String(docsFailed)} document(s) failed to upload — retry from load detail page.`,
        { variant: 'warning' },
      );
    } else {
      yield call(enqueueSnackbar, isDraft ? 'Draft saved' : 'Load created', { variant: 'success' });
    }

    if (!isDraft) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, `/loads/${load.id}?showRateConPrompt=true`);
    }

    yield put(fetchLoadsRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    let errorMessage = 'Failed to create load';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Extract API validation errors from Axios response
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const resp = (error as { response?: { data?: { errors?: { message: string }[] } } }).response;
      const apiErrors = resp?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        errorMessage = apiErrors.map((e) => e.message).join('. ');
      }
    }

    yield put(createLoadFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
