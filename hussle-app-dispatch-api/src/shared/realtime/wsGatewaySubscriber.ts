import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { Logger } from '@/shared/utils/logger';

import type { RelayEventName } from './relayRouting';
import { computeRelayTargets, RELAY_EVENTS } from './relayRouting';
import type { SocketServerHandle } from './socketServer';

interface WsGatewaySubscriberDeps {
  eventBus: EventBus;
  socketServer: SocketServerHandle;
  logger: Logger;
}

const QUEUE_GROUP = 'ws-gateway';

/**
 * Subscribes the ws-gateway to the relayable load events and fans each one out
 * to its computed rooms (org room always; driver room when driver-visible and
 * a driverId is present). Uses its OWN queue group (`ws-gateway`), distinct
 * from the worker's `load-timestamp-service`, so both consume independently.
 *
 * Idempotency: emits are fire-and-forget realtime pushes with no persistent
 * side effect, so a redelivered event simply re-emits — harmless. Errors are
 * logged, not rethrown (best-effort transport).
 */
export const createWsGatewaySubscriber = async (deps: WsGatewaySubscriberDeps): Promise<void> => {
  const relay = <K extends RelayEventName>(eventName: K, data: EventMap[K]): void => {
    const targets = computeRelayTargets(eventName, data);
    targets.forEach((target) => {
      if (target.room.startsWith('driver:')) {
        const driverId = target.room.slice('driver:'.length);
        deps.socketServer.relayToDriver(driverId, target.eventName, data);
        return;
      }
      const organizationId = target.room.slice('org:'.length);
      deps.socketServer.relayToOrg(organizationId, target.eventName, data);
    });
  };

  await Promise.all(
    RELAY_EVENTS.map((eventName) =>
      deps.eventBus.subscribe(eventName, QUEUE_GROUP, async (data) => {
        relay(eventName, data);
      }),
    ),
  );

  deps.logger.info('ws-gateway subscriber initialized', { events: RELAY_EVENTS.length });
};
