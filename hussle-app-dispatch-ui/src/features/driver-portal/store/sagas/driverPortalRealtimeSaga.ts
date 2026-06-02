import { eventChannel, type EventChannel } from 'redux-saga';
import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import type { Socket } from 'socket.io-client';
import { createRealtimeSocket, REALTIME_EVENTS } from 'utils/realtime/socketClient';
import type { RealtimeEventPayload } from 'utils/realtime/socketClient';
import {
  fetchDriverPortalLoadRequest,
  fetchDriverPortalLoadSuccess,
} from '../reducers/driverPortalPageSlice';

type ChannelMessage =
  | { kind: 'event'; loadId: string }
  | { kind: 'reconnect' };

// Bridges the driver's socket room into a saga channel. The gateway derives the
// driver room from the session cookie, so the client only listens. Polling in
// the page stays as a slow fallback; this is the fast push path.
const createSocketChannel = (socket: Socket): EventChannel<ChannelMessage> =>
  eventChannel<ChannelMessage>((emit) => {
    REALTIME_EVENTS.forEach((eventName) => {
      socket.on(eventName, (payload: RealtimeEventPayload) => {
        if (payload?.loadId) {
          emit({ kind: 'event', loadId: payload.loadId });
        }
      });
    });

    const handleReconnect = (): void => emit({ kind: 'reconnect' });
    socket.io.on('reconnect', handleReconnect);

    return () => {
      REALTIME_EVENTS.forEach((eventName) => socket.off(eventName));
      socket.io.off('reconnect', handleReconnect);
      socket.disconnect();
    };
  });

// Tracks the load the driver currently has open so we only react to events for
// that load and can resync it on reconnect.
let openLoadId: string | null = null;

function* trackOpenLoad(
  action:
    | ReturnType<typeof fetchDriverPortalLoadRequest>
    | ReturnType<typeof fetchDriverPortalLoadSuccess>,
): Generator {
  openLoadId = action.payload.loadId;
  yield;
}

export function* driverPortalRealtimeSaga(): Generator {
  yield takeEvery(
    [fetchDriverPortalLoadRequest.type, fetchDriverPortalLoadSuccess.type],
    trackOpenLoad,
  );

  const socket = (yield call(createRealtimeSocket)) as Socket;
  const channel = (yield call(createSocketChannel, socket)) as EventChannel<ChannelMessage>;

  yield fork(function* watchChannel(): Generator {
    while (true) {
      const message = (yield take(channel)) as ChannelMessage;
      if (message.kind === 'event') {
        // Only refetch when the event concerns the load the driver is viewing.
        if (openLoadId && message.loadId === openLoadId) {
          yield put(fetchDriverPortalLoadRequest({ loadId: openLoadId }));
        }
      } else if (openLoadId) {
        yield put(fetchDriverPortalLoadRequest({ loadId: openLoadId }));
      }
    }
  });
}
