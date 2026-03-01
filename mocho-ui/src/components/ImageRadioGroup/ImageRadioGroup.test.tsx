import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ImageRadioGroup from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

const mockOptions = [
  { value: 'option1', title: 'Option 1', imageUrl: 'https://example.com/1.png' },
  { value: 'option2', title: 'Option 2', imageUrl: 'https://example.com/2.png' },
  { value: 'option3', title: 'Option 3', imageUrl: 'https://example.com/3.png' },
];

// Helper to get radio by value since the Radio is visually hidden with complex labels
const getRadioByValue = (container: HTMLElement, value: string) => {
  return container.querySelector(`input[type="radio"][value="${value}"]`) as HTMLInputElement;
};

describe('ImageRadioGroup', () => {
  describe('rendering', () => {
    it('renders all options', () => {
      renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders images for each option', () => {
      renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/1.png');
    });

    it('renders radio buttons', () => {
      const { container } = renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      // Verify all three radio inputs exist
      expect(getRadioByValue(container, 'option1')).toBeInTheDocument();
      expect(getRadioByValue(container, 'option2')).toBeInTheDocument();
      expect(getRadioByValue(container, 'option3')).toBeInTheDocument();
    });
  });

  describe('uncontrolled behavior', () => {
    it('uses defaultValue when provided', () => {
      const { container } = renderWithTheme(
        <ImageRadioGroup options={mockOptions} defaultValue="option2" />
      );

      // The selected option should be checked
      const radio = getRadioByValue(container, 'option2');
      expect(radio).toBeChecked();
    });

    it('updates selection on click', async () => {
      const user = userEvent.setup();
      const { container } = renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      // Click on Option 2 label
      await user.click(screen.getByText('Option 2'));

      const radio = getRadioByValue(container, 'option2');
      expect(radio).toBeChecked();
    });
  });

  describe('controlled behavior', () => {
    it('uses selectedValue when provided', () => {
      const { container } = renderWithTheme(
        <ImageRadioGroup options={mockOptions} selectedValue="option3" />
      );

      const radio = getRadioByValue(container, 'option3');
      expect(radio).toBeChecked();
    });

    it('calls onChange when selection changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderWithTheme(
        <ImageRadioGroup
          options={mockOptions}
          selectedValue="option1"
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Option 2'));

      expect(onChange).toHaveBeenCalledWith('option2');
    });

    it('does not update internal state when controlled', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <ImageRadioGroup
          options={mockOptions}
          selectedValue="option1"
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Option 2'));

      // Still checked option1 because parent didn't update selectedValue
      const radio1 = getRadioByValue(container, 'option1');
      expect(radio1).toBeChecked();
    });
  });

  describe('accessibility', () => {
    it('has radiogroup role', () => {
      renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('has radio inputs for each option', () => {
      const { container } = renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      const radios = container.querySelectorAll('input[type="radio"]');
      expect(radios).toHaveLength(3);
    });

    it('images have alt text', () => {
      renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Option 1');
      expect(images[1]).toHaveAttribute('alt', 'Option 2');
    });
  });

  describe('visual feedback', () => {
    it('shows selection indicator on selected option', async () => {
      const user = userEvent.setup();
      const { container } = renderWithTheme(<ImageRadioGroup options={mockOptions} />);

      await user.click(screen.getByText('Option 1'));

      // The radio should be checked
      const radio = getRadioByValue(container, 'option1');
      expect(radio).toBeChecked();
    });
  });
});
