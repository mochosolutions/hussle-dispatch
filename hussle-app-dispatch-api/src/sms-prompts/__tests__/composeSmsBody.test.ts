import { composeSmsBody } from '../services/composeSmsBody';
import type {
  LoadForScheduling,
  LoadSchedulerStop,
} from '../types/loadSchedulerQueryPort';

const SHORT_URL = 'https://h.example.com/s/AbCd1234';

const DISPATCHED_REGEX =
  /^Hussle: Load #\S+ dispatched\n.+ → .+\n🕖 PU: .+ \| 🕛 DEL: .+\n(?:(?:❄️ Reefer|🚛 Dry Van|🛻 Flatbed)\n)?https?:\/\/.+\/s\/[a-zA-Z0-9]{8}$/;
const PRE_PICKUP_REGEX =
  /^Hussle: Load #\S+ pickup is coming up\. Confirm you're en route\.\nhttps?:\/\/.+\/s\/[a-zA-Z0-9]{8}$/;
const POST_PICKUP_REGEX =
  /^Hussle: Load #\S+ — pickup window passed\. Update status now\.\n.+$/;
const TRANSIT_REGEX =
  /^Hussle: Load #\S+ status check\. Tap to share current location\.\n.+$/;
const MANUAL_REGEX = /^Hussle: Load #\S+ needs a check-in\.\n.+$/;

const baseLoad = (
  overrides: Partial<LoadForScheduling> = {},
): LoadForScheduling => ({
  id: 'load-1',
  loadNumber: '42',
  organizationId: 'org-1',
  driverId: 'driver-1',
  status: 'DISPATCHED',
  equipmentType: null,
  stops: [],
  ...overrides,
});

const pickupStop: LoadSchedulerStop = {
  sequence: 1,
  type: 'PICKUP',
  appointmentStart: new Date('2026-05-01T12:00:00Z'),
  appointmentEnd: null,
  departureTime: null,
  city: 'Houston',
  state: 'TX',
};

const deliveryStop: LoadSchedulerStop = {
  sequence: 2,
  type: 'DELIVERY',
  appointmentStart: new Date('2026-05-02T17:00:00Z'),
  appointmentEnd: null,
  departureTime: null,
  city: 'Atlanta',
  state: 'GA',
};

const richStops: LoadSchedulerStop[] = [pickupStop, deliveryStop];

describe('composeSmsBody', () => {
  describe('DISPATCHED', () => {
    it('renders the rich body and includes the REEFER equipment line', () => {
      const load = baseLoad({ equipmentType: 'REEFER', stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(DISPATCHED_REGEX);
      expect(body).toContain('❄️ Reefer');
      expect(body).toContain('Houston, TX → Atlanta, GA');
    });

    it('renders the DRY_VAN equipment line', () => {
      const load = baseLoad({ equipmentType: 'DRY_VAN', stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(DISPATCHED_REGEX);
      expect(body).toContain('🚛 Dry Van');
    });

    it('renders the FLATBED equipment line', () => {
      const load = baseLoad({ equipmentType: 'FLATBED', stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(DISPATCHED_REGEX);
      expect(body).toContain('🛻 Flatbed');
    });

    it('omits the equipment line for STEP_DECK', () => {
      const load = baseLoad({ equipmentType: 'STEP_DECK', stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body.split('\n')).toHaveLength(4);
      expect(body).not.toMatch(/Reefer|Dry Van|Flatbed|Step/);
    });

    it('omits the equipment line when equipmentType is null', () => {
      const load = baseLoad({ equipmentType: null, stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body.split('\n')).toHaveLength(4);
    });

    it('degrades when origin stop is missing city', () => {
      const load = baseLoad({
        stops: [{ ...pickupStop, city: null }, deliveryStop],
      });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toBe(`Hussle: Load #42 dispatched\n${SHORT_URL}`);
    });

    it('degrades when destination stop is missing state', () => {
      const load = baseLoad({
        stops: [pickupStop, { ...deliveryStop, state: null }],
      });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toBe(`Hussle: Load #42 dispatched\n${SHORT_URL}`);
    });

    it('formats times in the resolved local timezone for known cities', () => {
      const load = baseLoad({ stops: richStops });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      // 12:00Z in Houston (CDT, UTC-5 on May 1) should render as 7:00 AM
      expect(body).toMatch(/PU: 7:00\sAM/);
      // 17:00Z on May 2 in Atlanta (EDT, UTC-4) should render as 1:00 PM
      expect(body).toMatch(/DEL: 1:00\sPM/);
      // No UTC suffix
      expect(body).not.toContain(' UTC');
    });

    it('formats times with UTC suffix when state is unknown', () => {
      const load = baseLoad({
        stops: [
          { ...pickupStop, state: 'ZZ' },
          { ...deliveryStop, state: 'ZZ' },
        ],
      });

      const body = composeSmsBody({
        anchor: 'DISPATCHED',
        load,
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(/UTC/);
    });
  });

  describe('PRE_PICKUP', () => {
    it('matches the PRE_PICKUP regex', () => {
      const body = composeSmsBody({
        anchor: 'PRE_PICKUP',
        load: baseLoad(),
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(PRE_PICKUP_REGEX);
    });
  });

  describe('POST_PICKUP', () => {
    it('matches the POST_PICKUP regex', () => {
      const body = composeSmsBody({
        anchor: 'POST_PICKUP',
        load: baseLoad(),
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(POST_PICKUP_REGEX);
    });
  });

  describe('TRANSIT_INTERVAL', () => {
    it('matches the TRANSIT_INTERVAL regex', () => {
      const body = composeSmsBody({
        anchor: 'TRANSIT_INTERVAL',
        load: baseLoad(),
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(TRANSIT_REGEX);
    });
  });

  describe('MANUAL', () => {
    it('matches the MANUAL regex', () => {
      const body = composeSmsBody({
        anchor: 'MANUAL',
        load: baseLoad(),
        shortUrl: SHORT_URL,
      });

      expect(body).toMatch(MANUAL_REGEX);
      expect(body).toBe(
        `Hussle: Load #42 needs a check-in.\n${SHORT_URL}`,
      );
    });
  });
});
