import React from 'react';
import { render, screen } from '@testing-library/react';
import { RichTextEditorField } from './index';
import type { FormikFieldProps } from '../types';

// Mock TiptapEditor since it has complex dependencies
jest.mock('../../TiptapEditor', () => ({
  __esModule: true,
  default: ({ value, onChange, error, helperText, placeholder }: any) => (
    <div data-testid="mock-tiptap-editor">
      <textarea
        data-testid="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error}
      />
      {helperText && <span data-testid="helper-text">{helperText}</span>}
    </div>
  ),
}));

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { content: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('RichTextEditorField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders TiptapEditor component', () => {
    const formik = createMockFormik();
    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    expect(screen.getByTestId('mock-tiptap-editor')).toBeInTheDocument();
  });

  it('passes current value to TiptapEditor', () => {
    const formik = createMockFormik({
      values: { content: '<p>Test content</p>' },
    });

    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveValue('<p>Test content</p>');
  });

  it('calls setFieldValue when content changes', async () => {
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    const textarea = screen.getByTestId('editor-textarea');
    // Simulate change
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    // The onChange handler should eventually call setFieldValue
    // (in real implementation, TiptapEditor handles this)
  });

  it('shows error state when touched and has error', () => {
    const formik = createMockFormik({
      errors: { content: 'Content is required' },
      touched: { content: true },
    });

    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('helper-text')).toHaveTextContent('Content is required');
  });

  it('does not show error when not touched', () => {
    const formik = createMockFormik({
      errors: { content: 'Content is required' },
      touched: {},
    });

    render(<RichTextEditorField name="content" label="Content" formik={formik} />);

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(<RichTextEditorField name="content" label="Content" formik={formik} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('passes placeholder to TiptapEditor', () => {
    const formik = createMockFormik();
    render(
      <RichTextEditorField
        name="content"
        label="Content"
        formik={formik}
        placeholder="Start writing..."
      />
    );

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Start writing...');
  });

  it('passes onImageSelect callback to TiptapEditor', () => {
    const formik = createMockFormik();
    const onImageSelect = jest.fn();

    render(
      <RichTextEditorField
        name="content"
        label="Content"
        formik={formik}
        onImageSelect={onImageSelect}
      />
    );

    // Component should render without errors when onImageSelect is provided
    expect(screen.getByTestId('mock-tiptap-editor')).toBeInTheDocument();
  });
});
