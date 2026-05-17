import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import { AddressTypeaheadField } from './index';
import { searchAddresses } from 'utils/api/places/placeApi';
import { enqueueSnackbar } from 'notistack';
import type { AddressSearchResult } from 'features/place/types';

jest.mock('utils/api/places/placeApi', () => ({
  searchAddresses: jest.fn(),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockedSearchAddresses = searchAddresses as jest.MockedFunction<typeof searchAddresses>;
const mockedEnqueueSnackbar = enqueueSnackbar as jest.MockedFunction<typeof enqueueSnackbar>;

interface FormShape {
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

const emptyAddress = { line1: '', line2: '', city: '', state: '', zip: '', country: '' };

const renderField = (initial: Partial<FormShape['address']> = {}) => {
  const onSubmit = jest.fn();
  const utils = render(
    <Formik<FormShape>
      initialValues={{ address: { ...emptyAddress, ...initial } }}
      onSubmit={onSubmit}
    >
      <Form>
        <AddressTypeaheadField name="address" label="Business address" />
      </Form>
    </Formik>,
  );
  return { ...utils, onSubmit };
};

const sampleResult: AddressSearchResult = {
  source: 'EXTERNAL',
  id: 'ext-1',
  name: '500 Main St',
  address: '500 Main St',
  city: 'Atlanta',
  state: 'GA',
  zip: '30301',
  lat: 33.749,
  lng: -84.388,
  facilityType: null,
  contactName: null,
  contactPhone: null,
  appointmentRequired: false,
  lumperRequired: false,
  ppeRequired: false,
  facilityHours: null,
  is24Hours: false,
};

describe('AddressTypeaheadField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSearchAddresses.mockReset();
  });

  it('renders the typeahead input by default', () => {
    renderField();
    expect(screen.getByLabelText(/business address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/start typing your address/i)).toBeInTheDocument();
  });

  it('shows a visible error with a Retry button when searchAddresses rejects', async () => {
    mockedSearchAddresses.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderField();
    const input = screen.getByPlaceholderText(/start typing your address/i);
    await user.type(input, '500 Main');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn't reach address lookup/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('auto-switches to manual entry after 3 consecutive failures', async () => {
    mockedSearchAddresses.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderField();
    const input = screen.getByPlaceholderText(/start typing your address/i);

    // First failure — typing two chars triggers a debounced search
    await user.type(input, 'AA');
    await waitFor(() => expect(mockedSearchAddresses).toHaveBeenCalledTimes(1));
    await screen.findByRole('alert');

    // Failure 2 — retry
    await user.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(mockedSearchAddresses).toHaveBeenCalledTimes(2));

    // Failure 3 — retry again, this should auto-fall through to manual
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(mockedSearchAddresses).toHaveBeenCalledTimes(3));

    // Manual mode renders the six address fields
    await waitFor(() => {
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state \/ region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip \/ postal code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^country$/i)).toBeInTheDocument();
  });

  it('switches to manual entry immediately when Skip lookup is clicked', async () => {
    mockedSearchAddresses.mockResolvedValue([]);
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole('button', { name: /skip lookup/i }));

    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city$/i)).toBeInTheDocument();
  });

  it('populates Formik address fields when a typeahead result is selected', async () => {
    mockedSearchAddresses.mockResolvedValue([sampleResult]);
    const user = userEvent.setup();

    const onSubmit = jest.fn();
    render(
      <Formik<FormShape>
        initialValues={{ address: { ...emptyAddress } }}
        onSubmit={onSubmit}
      >
        {({ values }) => (
          <Form>
            <AddressTypeaheadField name="address" label="Business address" />
            <div data-testid="snapshot">{JSON.stringify(values.address)}</div>
            <button type="submit">submit</button>
          </Form>
        )}
      </Formik>,
    );

    const input = screen.getByPlaceholderText(/start typing your address/i);
    await user.type(input, '500 Main');

    // Wait for the option to render in the listbox
    const option = await screen.findByText('500 Main St', { selector: '.MuiTypography-root' });
    await user.click(option);

    await waitFor(() => {
      const snapshot = screen.getByTestId('snapshot').textContent ?? '';
      expect(snapshot).toContain('"line1":"500 Main St"');
      expect(snapshot).toContain('"city":"Atlanta"');
      expect(snapshot).toContain('"state":"GA"');
      expect(snapshot).toContain('"zip":"30301"');
    });
  });

  it('calls enqueueSnackbar at most once per error sequence', async () => {
    mockedSearchAddresses.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    renderField();
    const input = screen.getByPlaceholderText(/start typing your address/i);

    await user.type(input, 'AB');
    await waitFor(() => expect(mockedSearchAddresses).toHaveBeenCalledTimes(1));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(mockedSearchAddresses).toHaveBeenCalledTimes(2));

    // A second snackbar would mean we re-toasted on the second failure.
    expect(mockedEnqueueSnackbar).toHaveBeenCalledTimes(1);
  });
});
