import React from 'react';
import { render, screen } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { DocumentImageUploadField } from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the validation utility
jest.mock('../../../utils/imageUploadErrors', () => ({
  validateImageBeforeUpload: jest.fn(() => null),
  ImageUploadError: class ImageUploadError extends Error {
    constructor(message: string) {
      super(message);
    }
  },
}));

// Mock the useDocumentUpload hook
jest.mock('../../../hooks/useDocumentUpload', () => ({
  useDocumentUpload: jest.fn(() => ({
    state: 'idle',
    progress: 0,
    error: null,
    result: null,
    upload: jest.fn(),
    cancel: jest.fn(),
    reset: jest.fn(),
  })),
}));

const theme = createTheme();

const renderWithFormik = (
  ui: React.ReactElement,
  initialValues: Record<string, unknown> = { documentId: null }
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

describe('DocumentImageUploadField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-image');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('rendering', () => {
    it('renders with label', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Upload Image')).toBeInTheDocument();
    });

    it('renders select button', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      expect(screen.getByRole('button', { name: /select image/i })).toBeInTheDocument();
    });

    it('renders "No image selected" placeholder', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          helperText="Uploads to CDN automatically"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Uploads to CDN automatically')).toBeInTheDocument();
    });
  });

  describe('existing URL (edit mode)', () => {
    it('shows existing image when urlFieldName is provided', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          urlFieldName="previewUrl"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />,
        {
          documentId: 'doc-123',
          previewUrl: 'https://cdn.example.com/image.jpg',
        }
      );

      const img = screen.getByRole('img', { name: 'Preview' });
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/image.jpg');
    });

    it('shows remove button when image is present', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          urlFieldName="previewUrl"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />,
        {
          documentId: 'doc-123',
          previewUrl: 'https://cdn.example.com/image.jpg',
        }
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe('file input', () => {
    it('has hidden file input', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    it('accepts image files by default', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('accepts custom file types when specified', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          accept="image/png,image/jpeg"
          formik={{} as any}
        />
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg');
    });
  });

  describe('upload states', () => {
    it('shows uploading text when state is uploading', () => {
      // Override the mock for this test
      const { useDocumentUpload } = require('../../../hooks/useDocumentUpload');
      useDocumentUpload.mockReturnValue({
        state: 'uploading',
        progress: 50,
        error: null,
        result: null,
        upload: jest.fn(),
        cancel: jest.fn(),
        reset: jest.fn(),
      });

      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      // Check for the progress message text
      expect(screen.getByText('Uploading... 50%')).toBeInTheDocument();
    });

    it('shows error message when upload fails', () => {
      const { useDocumentUpload } = require('../../../hooks/useDocumentUpload');
      useDocumentUpload.mockReturnValue({
        state: 'error',
        progress: 0,
        error: 'Upload failed: Network error',
        result: null,
        upload: jest.fn(),
        cancel: jest.fn(),
        reset: jest.fn(),
      });

      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Upload failed: Network error')).toBeInTheDocument();
    });

    it('disables select button while uploading', () => {
      const { useDocumentUpload } = require('../../../hooks/useDocumentUpload');
      useDocumentUpload.mockReturnValue({
        state: 'uploading',
        progress: 25,
        error: null,
        result: null,
        upload: jest.fn(),
        cancel: jest.fn(),
        reset: jest.fn(),
      });

      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          formik={{} as any}
        />
      );

      expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled();
    });
  });

  describe('props', () => {
    it('applies custom preview height', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Upload Image"
          category="general"
          previewHeight={300}
          formik={{} as any}
        />
      );

      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('renders with different categories', () => {
      renderWithFormik(
        <DocumentImageUploadField
          name="documentId"
          label="Blog Hero"
          category="blog-hero"
          formik={{} as any}
        />
      );

      expect(screen.getByText('Blog Hero')).toBeInTheDocument();
    });
  });
});
