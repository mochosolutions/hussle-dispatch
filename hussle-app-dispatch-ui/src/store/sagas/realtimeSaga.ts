import { eventChannel, type EventChannel } from 'redux-saga';
import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import type { Socket } from 'socket.io-client';
import { createRealtimeSocket, REALTIME_EVENTS } from 'utils/realtime/socketClient';
import type { RealtimeEventPayload } from 'utils/realtime/socketClient';
import { fetchLoadDetailsRequest } from 'features/load/store/reducers/loadPageSlice';

// Channel messages — either a domain event carrying a loadId to refetch, or a
// reconnect signal that resyncs whichever load detail is currently open.
type ChannelMessage =
  | { kind: 'event'; loadId: string }
  | { kind: 'reconnect' };

// Bridges socket.io callbacks into a redux-saga channel. The gateway derives
// rooms from the session cookie, so the client only listens — it never emits
// room/org identifiers. Polling stays in place as a slow fallback; this channel
// is the fast push path.
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

// Tracks the load detail the dispatcher currently has open so a reconnect can
// fire a single REST refetch to resync after a dropped connection.
let openLoadId: string | null = null;

function* trackOpenLoad(action: ReturnType<typeof fetchLoadDetailsRequest>): Generator {
  openLoadId = action.payload.id;
  yield;
}

export function* realtimeSaga(): Generator {
  yield takeEvery(fetchLoadDetailsRequest.type, trackOpenLoad);

  const socket = (yield call(createRealtimeSocket)) as Socket;
  const channel = (yield call(createSocketChannel, socket)) as EventChannel<ChannelMessage>;

  yield fork(function* watchChannel(): Generator {
    while (true) {
      const message = (yield take(channel)) as ChannelMessage;
      if (message.kind === 'event') {
        yield put(fetchLoadDetailsRequest({ id: message.loadId }));
      } else if (openLoadId) {
        // Reconnect — resync the load the dispatcher is currently viewing.
        yield put(fetchLoadDetailsRequest({ id: openLoadId }));
      }
    }
  });
}
