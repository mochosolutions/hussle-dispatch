jest.mock('@/config/env', () => ({
  env: {
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    AWS_LOCATION_MAP_NAME: '',
  },
}));

const placesSendMock = jest.fn();
const routesSendMock = jest.fn();
const mapsSendMock = jest.fn();

jest.mock('@aws-sdk/client-geo-places', () => ({
  GeoPlacesClient: jest.fn().mockImplementation(() => ({ send: placesSendMock })),
  SearchTextCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'SearchTextCommand',
    input,
  })),
  GeocodeCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'GeocodeCommand',
    input,
  })),
}));

jest.mock('@aws-sdk/client-geo-routes', () => ({
  GeoRoutesClient: jest.fn().mockImplementation(() => ({ send: routesSendMock })),
  CalculateRoutesCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'CalculateRoutesCommand',
    input,
  })),
}));

jest.mock('@aws-sdk/client-geo-maps', () => ({
  GeoMapsClient: jest.fn().mockImplementation(() => ({ send: mapsSendMock })),
  GetTileCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'GetTileCommand',
    input,
  })),
  GetSpritesCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'GetSpritesCommand',
    input,
  })),
  GetGlyphsCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'GetGlyphsCommand',
    input,
  })),
  GetStyleDescriptorCommand: jest.fn().mockImplementation((input: unknown) => ({
    __type: 'GetStyleDescriptorCommand',
    input,
  })),
}));

import { createAwsLocationProvider } from '../awsLocationProvider';

interface CapturedCommand {
  __type: string;
  input: Record<string, unknown>;
}

const lastCommand = (mock: jest.Mock): CapturedCommand => {
  const calls = mock.mock.calls;
  if (calls.length === 0) {
    throw new Error('No command sent');
  }
  const cmd = calls[calls.length - 1]?.[0] as CapturedCommand;
  return cmd;
};

describe('awsLocationProvider (v2 SDK)', () => {
  beforeEach(() => {
    placesSendMock.mockReset();
    routesSendMock.mockReset();
    mapsSendMock.mockReset();
  });

  describe('searchAddresses', () => {
    it('sends a SearchTextCommand with QueryText, IncludeCountries, MaxResults, and IntendedUse', async () => {
      placesSendMock.mockResolvedValue({ ResultItems: [] });
      const provider = createAwsLocationProvider();

      await provider.searchAddresses('Walmart Tucson', 5);

      const cmd = lastCommand(placesSendMock);
      expect(cmd.__type).toBe('SearchTextCommand');
      expect(cmd.input.QueryText).toBe('Walmart Tucson');
      expect(cmd.input.Filter).toEqual({ IncludeCountries: ['USA'] });
      expect(cmd.input.MaxResults).toBe(5);
      expect(cmd.input.IntendedUse).toBe('SingleUse');
    });

    it('uses the default US-center bias position when no biasPosition is provided', async () => {
      placesSendMock.mockResolvedValue({ ResultItems: [] });
      const provider = createAwsLocationProvider();

      await provider.searchAddresses('test', 5);

      const cmd = lastCommand(placesSendMock);
      expect(cmd.input.BiasPosition).toEqual([-98.5, 39.5]);
    });

    it('forwards the caller-supplied biasPosition to SearchTextCommand', async () => {
      placesSendMock.mockResolvedValue({ ResultItems: [] });
      const provider = createAwsLocationProvider();

      await provider.searchAddresses('test', 5, [-73.94, 40.73]);

      const cmd = lastCommand(placesSendMock);
      expect(cmd.input.BiasPosition).toEqual([-73.94, 40.73]);
    });

    it('maps a PointOfInterest result to GeocodeSuggestion with name set to Title', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointOfInterest',
            Title: 'Walmart Supercenter',
            Address: {
              Label: 'Walmart Supercenter, 455 E Wetmore Rd, Tucson, AZ 85705, USA',
              AddressNumber: '455',
              Street: 'E Wetmore Rd',
              Locality: 'Tucson',
              Region: { Code: 'AZ', Name: 'Arizona' },
              PostalCode: '85705',
            },
            Position: [-110.978, 32.301],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const results = await provider.searchAddresses('walmart tucson', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        name: 'Walmart Supercenter',
        address: '455 E Wetmore Rd',
        city: 'Tucson',
        state: 'AZ',
        zip: '85705',
        lat: 32.301,
        lng: -110.978,
      });
    });

    it('maps a non-POI (PointAddress) result with name = null', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointAddress',
            Title: '123 Main St, Dallas, TX 75001',
            Address: {
              AddressNumber: '123',
              Street: 'Main St',
              Locality: 'Dallas',
              Region: { Code: 'TX' },
              PostalCode: '75001',
            },
            Position: [-96.797, 32.7767],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const results = await provider.searchAddresses('123 main dallas', 5);

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBeNull();
      expect(results[0]?.address).toBe('123 Main St');
    });

    it('normalizes ZIP+4 formats (v1-style "02110 1802") down to ZIP5', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointAddress',
            Title: '1 Beacon St, Boston, MA',
            Address: {
              AddressNumber: '1',
              Street: 'Beacon St',
              Locality: 'Boston',
              Region: { Code: 'MA' },
              PostalCode: '02110 1802',
            },
            Position: [-71.058, 42.358],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const results = await provider.searchAddresses('1 beacon boston', 5);

      expect(results[0]?.zip).toBe('02110');
    });

    it('normalizes ZIP+4 formats (v2-style "02110-1802") down to ZIP5', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointAddress',
            Title: '1 Beacon St, Boston, MA',
            Address: {
              AddressNumber: '1',
              Street: 'Beacon St',
              Locality: 'Boston',
              Region: { Code: 'MA' },
              PostalCode: '02110-1802',
            },
            Position: [-71.058, 42.358],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const results = await provider.searchAddresses('1 beacon boston', 5);

      expect(results[0]?.zip).toBe('02110');
    });

    it('drops results without a Position', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'Locality',
            Title: 'Some Town',
            Address: { Locality: 'Some Town' },
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const results = await provider.searchAddresses('some town', 5);

      expect(results).toHaveLength(0);
    });
  });

  describe('geocode', () => {
    it('sends a GeocodeCommand with QueryComponents, IntendedUse=Storage, SecondaryAddresses, USA filter', async () => {
      placesSendMock.mockResolvedValue({ ResultItems: [] });
      const provider = createAwsLocationProvider();

      await provider.geocode({
        addressNumber: '455',
        street: 'E Wetmore Rd',
        city: 'Tucson',
        region: 'AZ',
        postalCode: '85705',
      });

      const cmd = lastCommand(placesSendMock);
      expect(cmd.__type).toBe('GeocodeCommand');
      expect(cmd.input.QueryComponents).toEqual({
        AddressNumber: '455',
        Street: 'E Wetmore Rd',
        Locality: 'Tucson',
        Region: 'AZ',
        PostalCode: '85705',
      });
      expect(cmd.input.IntendedUse).toBe('Storage');
      expect(cmd.input.AdditionalFeatures).toEqual(['SecondaryAddresses']);
      expect(cmd.input.Filter).toEqual({ IncludeCountries: ['USA'] });
    });

    it('returns a fully-populated GeocodeResult on a confident PointAddress match', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointAddress',
            Title: '455 E Wetmore Rd, Tucson, AZ 85705',
            MatchScores: { Overall: 0.95 },
            Address: {
              AddressNumber: '455',
              Street: 'E Wetmore Rd',
              StreetComponents: [
                { BaseName: 'Wetmore', Type: 'Rd', Prefix: 'E' },
              ],
              Locality: 'Tucson',
              Region: { Code: 'AZ' },
              PostalCode: '85705',
            },
            Position: [-110.978, 32.301],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const result = await provider.geocode({
        street: '455 E Wetmore Rd',
        city: 'Tucson',
        region: 'AZ',
      });

      expect(result).toEqual({
        matchScore: 0.95,
        type: 'PointAddress',
        title: '455 E Wetmore Rd, Tucson, AZ 85705',
        addressNumber: '455',
        streetBaseName: 'Wetmore',
        streetType: 'Rd',
        streetPrefix: 'E',
        city: 'Tucson',
        region: 'AZ',
        postalCode5: '85705',
        unit: null,
        lat: 32.301,
        lng: -110.978,
      });
    });

    it('returns null when AWS returns zero ResultItems', async () => {
      placesSendMock.mockResolvedValue({ ResultItems: [] });
      const provider = createAwsLocationProvider();

      const result = await provider.geocode({
        city: 'Nowhere',
        region: 'XX',
      });

      expect(result).toBeNull();
    });

    it('extracts unit from SecondaryAddressComponents[0].Number', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'InferredSecondaryAddress',
            Title: '100 Main St Apt 5, Boston, MA',
            MatchScores: { Overall: 0.88 },
            Address: {
              AddressNumber: '100',
              StreetComponents: [{ BaseName: 'Main', Type: 'St' }],
              Locality: 'Boston',
              Region: { Code: 'MA' },
              PostalCode: '02110',
              SecondaryAddressComponents: [
                { Number: '5', Designator: 'Apt' },
              ],
            },
            Position: [-71.058, 42.358],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const result = await provider.geocode({
        addressNumber: '100',
        street: 'Main St',
        city: 'Boston',
        region: 'MA',
      });

      expect(result?.unit).toBe('5');
    });

    it('normalizes ZIP+4 PostalCode 11581-1008 down to ZIP5 11581', async () => {
      placesSendMock.mockResolvedValue({
        ResultItems: [
          {
            PlaceType: 'PointAddress',
            Title: 'Some address',
            MatchScores: { Overall: 0.9 },
            Address: {
              AddressNumber: '1',
              StreetComponents: [{ BaseName: 'Main', Type: 'St' }],
              Locality: 'Town',
              Region: { Code: 'NY' },
              PostalCode: '11581-1008',
            },
            Position: [-73.7, 40.6],
          },
        ],
      });
      const provider = createAwsLocationProvider();

      const result = await provider.geocode({
        street: '1 Main St',
        city: 'Town',
        region: 'NY',
      });

      expect(result?.postalCode5).toBe('11581');
    });
  });

  describe('calculateRoute', () => {
    it('sends a CalculateRoutesCommand with [lng, lat] tuples and returns miles + minutes', async () => {
      routesSendMock.mockResolvedValue({
        Routes: [{ Summary: { Distance: 16093, Duration: 600 } }],
      });
      const provider = createAwsLocationProvider();

      const result = await provider.calculateRoute(
        { lat: 32.7767, lng: -96.797 },
        { lat: 29.7604, lng: -95.3698 },
      );

      const cmd = lastCommand(routesSendMock);
      expect(cmd.__type).toBe('CalculateRoutesCommand');
      expect(cmd.input.Origin).toEqual([-96.797, 32.7767]);
      expect(cmd.input.Destination).toEqual([-95.3698, 29.7604]);
      // 16093 meters ~= 10 miles
      expect(result.distanceMiles).toBeCloseTo(10, 1);
      expect(result.durationMinutes).toBe(10);
      expect(result.isEstimated).toBe(false);
    });

    it('throws when no Route or Summary is returned', async () => {
      routesSendMock.mockResolvedValue({ Routes: [] });
      const provider = createAwsLocationProvider();

      await expect(
        provider.calculateRoute(
          { lat: 1, lng: 1 },
          { lat: 2, lng: 2 },
        ),
      ).rejects.toThrow(/Route calculation/);
    });
  });

  describe('map tile operations', () => {
    it('sends a GetTileCommand for tiles', async () => {
      mapsSendMock.mockResolvedValue({
        Blob: new Uint8Array([1, 2, 3]),
        ContentType: 'application/x-protobuf',
      });
      const provider = createAwsLocationProvider();

      const tile = await provider.getMapTile('ignored', { z: '5', x: '10', y: '12' });

      const cmd = lastCommand(mapsSendMock);
      expect(cmd.__type).toBe('GetTileCommand');
      expect(cmd.input.Z).toBe('5');
      expect(cmd.input.X).toBe('10');
      expect(cmd.input.Y).toBe('12');
      expect(tile.body).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('sends a GetSpritesCommand with required Style/ColorScheme/Variant', async () => {
      mapsSendMock.mockResolvedValue({
        Blob: new Uint8Array([1]),
        ContentType: 'image/png',
      });
      const provider = createAwsLocationProvider();

      await provider.getSprites('ignored', 'sprites.png');

      const cmd = lastCommand(mapsSendMock);
      expect(cmd.__type).toBe('GetSpritesCommand');
      expect(cmd.input.FileName).toBe('sprites.png');
      expect(cmd.input.Style).toBeDefined();
      expect(cmd.input.ColorScheme).toBeDefined();
      expect(cmd.input.Variant).toBeDefined();
    });

    it('sends a GetGlyphsCommand', async () => {
      mapsSendMock.mockResolvedValue({
        Blob: new Uint8Array([2]),
        ContentType: 'application/x-protobuf',
      });
      const provider = createAwsLocationProvider();

      await provider.getGlyphs('ignored', 'Amazon Ember Bold', '0-255');

      const cmd = lastCommand(mapsSendMock);
      expect(cmd.__type).toBe('GetGlyphsCommand');
      expect(cmd.input.FontStack).toBe('Amazon Ember Bold');
      expect(cmd.input.FontUnicodeRange).toBe('0-255');
    });

    it('sends a GetStyleDescriptorCommand', async () => {
      mapsSendMock.mockResolvedValue({
        Blob: new Uint8Array([3]),
        ContentType: 'application/json',
      });
      const provider = createAwsLocationProvider();

      const result = await provider.getStyleDescriptor('ignored');

      const cmd = lastCommand(mapsSendMock);
      expect(cmd.__type).toBe('GetStyleDescriptorCommand');
      expect(cmd.input.Style).toBeDefined();
      expect(result.contentType).toBe('application/json');
    });
  });
});
