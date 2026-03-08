import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadField } from './index';
import type { FormikFieldProps } from '../types';

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  jest.clearAllMocks();
});

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { heroImageFile: null, heroImage: null },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('ImageUploadField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    expect(screen.getByText('Hero Image')).toBeInTheDocument();
  });

  it('renders upload button', () => {
    const formik = createMockFormik();
    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    expect(screen.getByRole('button', { name: /select image/i })).toBeInTheDocument();
  });

  it('shows placeholder when no image is selected', () => {
    const formik = createMockFormik();
    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    expect(screen.getByText(/no image selected/i)).toBeInTheDocument();
  });

  it('calls setFieldValue when valid file is selected', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    const file = createMockFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(setFieldValue).toHaveBeenCalledWith('heroImageFile', file);
  });

  it('shows image preview when file is selected', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    const file = createMockFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    // After upload, preview should show (via blob URL)
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });
  });

  it('shows remove button when image is selected', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    const file = createMockFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  it('clears image when remove button is clicked', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    const file = createMockFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(setFieldValue).toHaveBeenCalledWith('heroImageFile', null);
  });

  it('shows validation error for invalid file type', async () => {
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<ImageUploadField name="heroImageFile" label="Hero Image" formik={formik} />);

    // Create file with invalid type
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Manually trigger change event with the file
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      configurable: true,
    });

    // Trigger the change event manually
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);

    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });

    // Should not call setFieldValue for invalid file
    expect(setFieldValue).not.toHaveBeenCalled();
  });

  it('shows validation error for file too large', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(
      <ImageUploadField
        name="heroImageFile"
        label="Hero Image"
        formik={formik}
        maxSizeMB={1}
      />
    );

    // Create a file larger than 1MB
    const largeFile = createMockFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/too large/i)).toBeInTheDocument();
    });

    expect(setFieldValue).not.toHaveBeenCalled();
  });

  it('shows existing image URL in edit mode', () => {
    const formik = createMockFormik({
      values: { heroImageFile: null, heroImage: 'https://example.com/image.jpg' },
    });

    render(
      <ImageUploadField
        name="heroImageFile"
        urlFieldName="heroImage"
        label="Hero Image"
        formik={formik}
      />
    );

    const img = screen.getByRole('img', { name: /preview/i });
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('clears both file and URL fields when removing', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({
      values: { heroImageFile: null, heroImage: 'https://example.com/image.jpg' },
      setFieldValue,
    });

    render(
      <ImageUploadField
        name="heroImageFile"
        urlFieldName="heroImage"
        label="Hero Image"
        formik={formik}
      />
    );

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(setFieldValue).toHaveBeenCalledWith('heroImageFile', null);
    expect(setFieldValue).toHaveBeenCalledWith('heroImage', null);
  });

  it('displays helper text when provided', () => {
    const formik = createMockFormik();
    render(
      <ImageUploadField
        name="heroImageFile"
        label="Hero Image"
        formik={formik}
        helperText="Recommended size: 1200x630px"
      />
    );

    expect(screen.getByText('Recommended size: 1200x630px')).toBeInTheDocument();
  });

  it('respects custom accept prop', () => {
    const formik = createMockFormik();
    render(
      <ImageUploadField
        name="heroImageFile"
        label="Hero Image"
        formik={formik}
        accept=".png,.jpg"
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', '.png,.jpg');
  });
});
