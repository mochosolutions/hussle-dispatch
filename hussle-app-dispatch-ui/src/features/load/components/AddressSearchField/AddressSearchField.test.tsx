import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikProps } from 'formik';
import type { AddressSearchResult } from 'features/place/types';
import type { LoadFormValues } from '../../validators/loadSchema';

jest.mock('utils/api/places/placeApi', () => ({
  searchAddresses: jest.fn(),
  createPlace: jest.fn(),
}));

jest.mock('features/ui/hooks/useDrawerActions', () => ({
  useDrawerActions: () => ({
    openDrawer: jest.fn(),
  }),
}));

jest.mock('store', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));

const { searchAddresses } = jest.requireMock('utils/api/places/placeApi') as {
  searchAddresses: jest.Mock;
};

// Import after mocks
const { AddressSearchField } = require('./index') as {
  AddressSearchField: React.FC<{
    prefix: string;
    formik: FormikProps<LoadFormValues>;
    disabled?: boolean;
  }>;
};

const buildMockFormik = (
  overrides?: Partial<{ facilityName: string; placeId: string; address: string; city: string; state: string; zip: string }>,
): FormikProps<LoadFormValues> =>
  ({
    values: {
      stops: [
        {
          facilityName: '',
          placeId: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          contactName: '',
          contactPhone: '',
          appointmentRequired: false,
          lumperRequired: false,
          ppeRequired: false,
          type: 'PICKUP',
          sequence: 1,
          ...overrides,
        },
      ],
    },
    errors: {},
    touched: {},
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    setFieldValue: jest.fn(),
    submitCount: 0,
  }) as unknown as FormikProps<LoadFormValues>;

const savedResult: AddressSearchResult = {
  source: 'SAVED',
  id: 'place-1',
  name: 'My Warehouse',
  address: '123 Main St',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  lat: 32.77,
  lng: -96.79,
  facilityType: 'WAREHOUSE',
  contactName: 'John',
  contactPhone: '555-0100',
  appointmentRequired: true,
  lumperRequired: false,
  ppeRequired: false,
};

const externalResult: AddressSearchResult = {
  source: 'EXTERNAL',
  id: 'ext-0',
  name: '456 Oak Ave, Houston, TX',
  address: '456 Oak Ave',
  city: 'Houston',
  state: 'TX',
  zip: '77001',
  lat: 29.76,
  lng: -95.37,
  facilityType: null,
  contactName: null,
  contactPhone: null,
  appointmentRequired: false,
  lumperRequired: false,
  ppeRequired: false,
};

describe('AddressSearchField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchAddresses.mockResolvedValue([]);
  });

  it('renders the search field in search mode when no selection', () => {
    const formik = buildMockFormik();
    render(<AddressSearchField prefix="stops[0]" formik={formik} />);
    expect(screen.getByText('Facility / Address')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders selected mode when facilityName is populated', () => {
    const formik = buildMockFormik({
      facilityName: 'My Warehouse',
      address: '123 Main St',
      city: 'Dallas',
      state: 'TX',
    });
    render(<AddressSearchField prefix="stops[0]" formik={formik} />);
    expect(screen.getByText('Change place')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('calls searchAddresses API on input', async () => {
    const user = userEvent.setup();
    searchAddresses.mockResolvedValue([savedResult, externalResult]);
    const formik = buildMockFormik();

    render(<AddressSearchField prefix="stops[0]" formik={formik} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'Dallas');

    await waitFor(() => {
      expect(searchAddresses).toHaveBeenCalled();
    });
  });

  it('renders grouped results with SAVED and RESULT chips', async () => {
    const user = userEvent.setup();
    searchAddresses.mockResolvedValue([savedResult, externalResult]);
    const formik = buildMockFormik();

    render(<AddressSearchField prefix="stops[0]" formik={formik} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByText('SAVED')).toBeInTheDocument();
      expect(screen.getByText('RESULT')).toBeInTheDocument();
    });
  });

  it('populates formik fields on option select and switches to selected mode', async () => {
    const user = userEvent.setup();
    searchAddresses.mockResolvedValue([savedResult]);
    const formik = buildMockFormik();

    render(<AddressSearchField prefix="stops[0]" formik={formik} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'warehouse');

    await waitFor(() => {
      expect(screen.getByText('My Warehouse')).toBeInTheDocument();
    });

    const option = screen.getByText('My Warehouse');
    await user.click(option);

    expect(formik.setFieldValue).toHaveBeenCalledWith('stops[0].placeId', 'place-1');
    expect(formik.setFieldValue).toHaveBeenCalledWith('stops[0].facilityName', 'My Warehouse');
    expect(formik.setFieldValue).toHaveBeenCalledWith('stops[0].address', '123 Main St');
    expect(formik.setFieldValue).toHaveBeenCalledWith('stops[0].city', 'Dallas');
    expect(formik.setFieldValue).toHaveBeenCalledWith('stops[0].state', 'TX');
  });
});
