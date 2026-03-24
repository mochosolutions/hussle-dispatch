import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveAsPlacePrompt } from './index';

jest.mock('utils/api/places/placeApi', () => ({
  createPlace: jest.fn(),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const { createPlace } = jest.requireMock('utils/api/places/placeApi') as {
  createPlace: jest.Mock;
};

const defaultProps = {
  name: 'Test Facility',
  address: '123 Main St',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  lat: 32.77,
  lng: -96.79,
  onSave: jest.fn(),
  onDismiss: jest.fn(),
};

describe('SaveAsPlacePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with pre-filled name', () => {
    render(<SaveAsPlacePrompt {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'Place name' });
    expect(input).toHaveValue('Test Facility');
    expect(screen.getByText('Save as Place?')).toBeInTheDocument();
  });

  it('calls createPlace on save and reports placeId', async () => {
    const user = userEvent.setup();
    createPlace.mockResolvedValue({ id: 'new-place-1' });

    render(<SaveAsPlacePrompt {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(createPlace).toHaveBeenCalledWith({
        name: 'Test Facility',
        address: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        latitude: 32.77,
        longitude: -96.79,
      });
      expect(defaultProps.onSave).toHaveBeenCalledWith('new-place-1');
    });
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    const user = userEvent.setup();

    render(<SaveAsPlacePrompt {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('allows editing the place name before saving', async () => {
    const user = userEvent.setup();
    createPlace.mockResolvedValue({ id: 'new-place-2' });

    render(<SaveAsPlacePrompt {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'Place name' });
    await user.clear(input);
    await user.type(input, 'Custom Name');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(createPlace).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Name' }),
      );
    });
  });
});
