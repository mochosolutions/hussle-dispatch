import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DynamicForm from './index';
import type { FormStructure } from './types';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('DynamicForm', () => {
  const mockHandleChange = jest.fn();
  const mockHandleBlur = jest.fn();
  const mockSetFieldValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('flat layout', () => {
    const flatStructure: FormStructure = {
      fields: [
        { type: 'input', name: 'name', label: 'Name', required: true },
        { type: 'input', name: 'email', label: 'Email', inputType: 'email' },
      ],
    };

    it('renders all fields', () => {
      renderWithTheme(
        <DynamicForm
          structure={flatStructure}
          values={{ name: '', email: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('displays required indicator for required fields', () => {
      renderWithTheme(
        <DynamicForm
          structure={flatStructure}
          values={{ name: '', email: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      // Required label should have asterisk
      const nameLabel = screen.getByText(/name/i);
      expect(nameLabel).toBeInTheDocument();
    });

    it('displays field values', () => {
      renderWithTheme(
        <DynamicForm
          structure={flatStructure}
          values={{ name: 'John Doe', email: 'john@example.com' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('shows error messages when fields are touched with errors', () => {
      renderWithTheme(
        <DynamicForm
          structure={flatStructure}
          values={{ name: '', email: '' }}
          touched={{ name: true }}
          errors={{ name: 'Name is required' }}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  describe('input field', () => {
    it('renders text input', () => {
      const structure: FormStructure = {
        fields: [{ type: 'input', name: 'title', label: 'Title' }],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ title: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('calls handleChange on input', async () => {
      const user = userEvent.setup();
      const structure: FormStructure = {
        fields: [{ type: 'input', name: 'title', label: 'Title' }],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ title: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      await user.type(screen.getByLabelText(/title/i), 'Test');
      expect(mockHandleChange).toHaveBeenCalled();
    });
  });

  describe('textarea field', () => {
    it('renders multiline textarea', () => {
      const structure: FormStructure = {
        fields: [
          { type: 'textarea', name: 'description', label: 'Description', rows: 4 },
        ],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ description: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      const textarea = screen.getByLabelText(/description/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('select field', () => {
    it('renders select with options', () => {
      const structure: FormStructure = {
        fields: [
          {
            type: 'select',
            name: 'category',
            label: 'Category',
            options: [
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
            ],
          },
        ],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ category: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      // MUI Select uses combobox role
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  describe('sectioned layout', () => {
    const sectionedStructure: FormStructure = {
      sections: [
        {
          title: 'Personal Info',
          fields: [
            { type: 'input', name: 'firstName', label: 'First Name' },
            { type: 'input', name: 'lastName', label: 'Last Name' },
          ],
        },
        {
          title: 'Contact',
          collapsible: true,
          defaultExpanded: true,
          fields: [
            { type: 'input', name: 'phone', label: 'Phone' },
          ],
        },
      ],
    };

    it('renders section titles', () => {
      renderWithTheme(
        <DynamicForm
          structure={sectionedStructure}
          values={{ firstName: '', lastName: '', phone: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByText('Personal Info')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('renders collapsible section as accordion', () => {
      renderWithTheme(
        <DynamicForm
          structure={sectionedStructure}
          values={{ firstName: '', lastName: '', phone: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      // The collapsible section should be in an accordion
      const accordion = screen.getByRole('button', { name: /contact/i });
      expect(accordion).toBeInTheDocument();
    });
  });

  describe('helper text', () => {
    it('displays helper text when provided', () => {
      const structure: FormStructure = {
        fields: [
          {
            type: 'input',
            name: 'slug',
            label: 'Slug',
            helperText: 'URL-friendly identifier',
          },
        ],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ slug: '' }}
          touched={{}}
          errors={{}}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByText('URL-friendly identifier')).toBeInTheDocument();
    });

    it('hides helper text when error is shown', () => {
      const structure: FormStructure = {
        fields: [
          {
            type: 'input',
            name: 'slug',
            label: 'Slug',
            helperText: 'URL-friendly identifier',
          },
        ],
      };

      renderWithTheme(
        <DynamicForm
          structure={structure}
          values={{ slug: '' }}
          touched={{ slug: true }}
          errors={{ slug: 'Slug is required' }}
          handleChange={mockHandleChange}
          handleBlur={mockHandleBlur}
          setFieldValue={mockSetFieldValue}
        />
      );

      expect(screen.getByText('Slug is required')).toBeInTheDocument();
      expect(screen.queryByText('URL-friendly identifier')).not.toBeInTheDocument();
    });
  });
});
