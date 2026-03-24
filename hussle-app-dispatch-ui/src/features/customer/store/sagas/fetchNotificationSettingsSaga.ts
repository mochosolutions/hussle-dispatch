import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getCustomerNotificationSettings } from 'utils/api/notifications/notificationApi';
import type { NotificationSetting } from 'utils/api/notifications/notificationApi';
import {
  fetchNotificationSettingsSuccess,
  fetchNotificationSettingsFailure,
} from '../reducers/customerPageSlice';

export function* fetchNotificationSettingsSaga(
  action: PayloadAction<{ customerId: string }>,
): Generator {
  try {
    const { customerId } = action.payload;
    const settings = (yield call(
      getCustomerNotificationSettings,
      customerId,
    )) as NotificationSetting[];

    yield put(fetchNotificationSettingsSuccess(settings));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notification settings';
    yield put(fetchNotificationSettingsFailure(errorMessage));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
