import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as Yup from 'yup';
import { EditableSection, EditableSectionField } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

interface TestData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const testData: TestData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'admin',
};

const basicFields: EditableSectionField[] = [
  { name: 'firstName', label: 'First Name', type: 'text' },
  { name: 'lastName', label: 'Last Name', type: 'text' },
];

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
});

describe('EditableSection', () => {
  describe('view mode', () => {
    it('renders section title', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    it('displays field values in view mode', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });

    it('shows edit button when canEdit is true', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          canEdit={true}
          onSave={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('hides edit button when canEdit is false', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          canEdit={false}
          onSave={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      // Should show form inputs
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('populates inputs with current data', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByLabelText('First Name')).toHaveValue('John');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    });

    it('returns to view mode when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should return to view mode
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('calls onSave with form values', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={onSave}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      // Modify a field
      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Doe',
          })
        );
      });
    });

    it('returns to view mode after successful save', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={onSave}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));
      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('disables save button when form is not dirty', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading is true', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          loading={true}
          onSave={jest.fn()}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      renderWithTheme(
        <EditableSection
          title="Personal Info"
          fields={basicFields}
          data={testData}
          loading={true}
          onSave={jest.fn()}
        />
      );

      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });
  });

  describe('select field', () => {
    it('renders select field with options', async () => {
      const user = userEvent.setup();
      const fieldsWithSelect: EditableSectionField[] = [
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { value: 'admin', label: 'Administrator' },
            { value: 'user', label: 'User' },
          ],
        },
      ];

      renderWithTheme(
        <EditableSection
          title="Settings"
          fields={fieldsWithSelect}
          data={testData}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      // Select field should be visible
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });
  });

  describe('read-only fields', () => {
    it('does not show edit input for non-editable fields', async () => {
      const user = userEvent.setup();
      const fieldsWithReadOnly: EditableSectionField[] = [
        { name: 'firstName', label: 'First Name', type: 'text', editable: true },
        { name: 'email', label: 'Email', type: 'text', editable: false },
      ];

      const dataWithEmail = { ...testData };

      renderWithTheme(
        <EditableSection
          title="Profile"
          fields={fieldsWithReadOnly}
          data={dataWithEmail}
          onSave={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));

      // First Name should be editable
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      // Email should still show as read-only text, not input
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    });
  });
});
