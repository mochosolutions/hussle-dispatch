import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import axios from 'axios';
import { getNavigate } from 'utils/getNavigate';
import { generateSettlement } from 'utils/api/accounting/settlementApi';
import { openModal } from 'features/ui/store/reducers/uiSlice';
import {
  generateSettlementRequest,
  generateSettlementSuccess,
  generateSettlementFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

interface MissingLoad {
  id: string;
  loadNumber: string;
}

interface ApiError {
  code: string;
  message: string;
  loadIds?: string[];
  loads?: MissingLoad[];
}

const extractMissingEstimatedHours = (
  error: unknown,
): { loadIds: string[]; loads: MissingLoad[]; message: string } | null => {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const data = error.response?.data as { errors?: ApiError[] } | undefined;
  const missing = data?.errors?.find((e) => e.code === 'MISSING_ESTIMATED_HOURS');
  if (!missing) {
    return null;
  }
  const loadIds = missing.loadIds ?? missing.loads?.map((l) => l.id) ?? [];
  const loads =
    missing.loads ?? (missing.loadIds ?? []).map((id) => ({ id, loadNumber: id }));
  return {
    loadIds,
    loads,
    message: missing.message,
  };
};

export function* generateSettlementSaga(
  action: ReturnType<typeof generateSettlementRequest>,
): Generator {
  try {
    const settlement = (yield call(
      generateSettlement,
      action.payload,
    )) as SagaReturnType<typeof generateSettlement>;

    yield put(settlementActions.addOne(settlement));
    yield put(generateSettlementSuccess({ id: settlement.id }));
    yield put(notify({ message: 'Settlement generated', variant: 'success' }));

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, `/accounting/settlements/${settlement.id}`);
  } catch (error: unknown) {
    const missing = extractMissingEstimatedHours(error);
    if (missing) {
      yield put(
        openModal({
          modalType: 'missingEstimatedHours',
          modalProps: missing,
        }),
      );
      yield put(generateSettlementFailure({ error: missing.message }));
      return;
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate settlement';
    yield put(generateSettlementFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
