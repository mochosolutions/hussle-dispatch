import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  autoHideDuration?: number;
  persist?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  variant: NotificationVariant;
  options?: NotificationOptions;
  occurredAt: number;
}

interface NotificationState {
  pending: Notification[];
}

interface NotifyInput {
  message: string;
  variant?: NotificationVariant;
  options?: NotificationOptions;
}

const initialState: NotificationState = {
  pending: [],
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<Notification>) {
        state.pending.push(action.payload);
      },
      prepare(input: NotifyInput) {
        const notification: Notification = {
          id: generateId(),
          message: input.message,
          variant: input.variant ?? 'default',
          options: input.options,
          occurredAt: Date.now(),
        };
        return { payload: notification };
      },
    },
    consumed(state, action: PayloadAction<string>) {
      state.pending = state.pending.filter((n) => n.id !== action.payload);
    },
    clearAll(state) {
      state.pending = [];
    },
  },
});

export const { notify, consumed, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
