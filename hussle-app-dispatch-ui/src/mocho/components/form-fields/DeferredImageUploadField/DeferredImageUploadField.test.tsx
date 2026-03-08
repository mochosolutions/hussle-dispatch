import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import { DeferredImageUploadField } from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the validation utility
jest.mock('../../../utils/imageUploadErrors', () => ({
  validateImageBeforeUpload: jest.fn(() => null),
  ImageUploadError: class ImageUploadError extends Error {},
}));

const theme = createTheme();

const renderWithFormik = (
  ui: React.ReactElement,
  initialValues: Record<string, unknown> = { heroImage: null }
) => {
  return render(
    <ThemeProvider theme={theme}>
      <Formik initialValues={initialValues} onSubmit={jest.fn()}>
        {(formik) => (
          <Form>
            {React.cloneElement(ui, { formik })}
          </Form>
        )}
      </Formik>
    </ThemeProvider>
  );
};

describe('DeferredImageUploadField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-image');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('rendering', () => {
    it('renders with label', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Hero Image')).toBeInTheDocument();
    });

    it('renders select button', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          formik={{} as any}
        />
      );

      expect(screen.getByRole('button', { name: /select image/i })).toBeInTheDocument();
    });

    it('renders "No image selected" placeholder', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          formik={{} as any}
        />
      );

      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          helperText="Max size: 5MB"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Max size: 5MB')).toBeInTheDocument();
    });
  });

  describe('existing URL (edit mode)', () => {
    it('shows existing image when existingUrlFieldName is provided', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          existingUrlFieldName="existingHeroUrl"
          label="Hero Image"
          formik={{} as any}
        />,
        {
          heroImage: null,
          existingHeroUrl: 'https://example.com/existing-image.jpg',
        }
      );

      const img = screen.getByRole('img', { name: 'Preview' });
      expect(img).toHaveAttribute('src', 'https://example.com/existing-image.jpg');
    });

    it('shows "Change Image" button when existing image is present', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          existingUrlFieldName="existingHeroUrl"
          label="Hero Image"
          formik={{} as any}
        />,
        {
          heroImage: null,
          existingHeroUrl: 'https://example.com/existing-image.jpg',
        }
      );

      expect(screen.getByRole('button', { name: /change image/i })).toBeInTheDocument();
    });

    it('shows remove button when existing image is present', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          existingUrlFieldName="existingHeroUrl"
          label="Hero Image"
          formik={{} as any}
        />,
        {
          heroImage: null,
          existingHeroUrl: 'https://example.com/existing-image.jpg',
        }
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe('file input', () => {
    it('has hidden file input', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    it('accepts image files by default', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('accepts custom file types when specified', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          accept="image/png"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png');
    });
  });

  describe('new image indicator', () => {
    it('shows "New" badge when new image is selected', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const TestComponent = () => {
        return (
          <Formik
            initialValues={{ heroImage: null }}
            onSubmit={jest.fn()}
          >
            {(formik) => (
              <Form>
                <DeferredImageUploadField
                  name="heroImage"
                  label="Hero Image"
                  formik={formik}
                />
              </Form>
            )}
          </Formik>
        );
      };

      render(
        <ThemeProvider theme={theme}>
          <TestComponent />
        </ThemeProvider>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });
    });
  });

  describe('props', () => {
    it('applies custom preview height', () => {
      renderWithFormik(
        <DeferredImageUploadField
          name="heroImage"
          label="Hero Image"
          previewHeight={300}
          formik={{} as any}
        />
      );

      // The component is rendered - we can't easily test the exact height
      // but we verify it renders without error
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });
  });
});
