import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import {
  bulkUpsertCustomerNotificationSettings,
} from 'utils/api/notifications/notificationApi';
import type {
  NotificationSetting,
  UpsertSettingInput,
} from 'utils/api/notifications/notificationApi';
import {
  updateNotificationSettingsSuccess,
  updateNotificationSettingsFailure,
} from '../reducers/customerPageSlice';

export function* updateNotificationSettingsSaga(
  action: PayloadAction<{ customerId: string; settings: UpsertSettingInput[] }>,
): Generator {
  try {
    const { customerId, settings } = action.payload;
    const results = (yield call(
      bulkUpsertCustomerNotificationSettings,
      customerId,
      settings,
    )) as NotificationSetting[];

    yield put(updateNotificationSettingsSuccess(results));
    yield call(enqueueSnackbar, 'Notification settings updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
    yield put(updateNotificationSettingsFailure(errorMessage));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
