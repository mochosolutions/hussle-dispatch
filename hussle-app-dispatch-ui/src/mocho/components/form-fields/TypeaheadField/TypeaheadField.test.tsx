import React from 'react';
import { Box, Typography } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypeaheadField } from './index';
import { FormikFieldProps, TypeaheadOption } from '../types';

const mockOptions: TypeaheadOption[] = [
	{
		value: 'abc-logistics',
		label: 'ABC Logistics',
		description: 'Broker • Tampa, FL',
	},
	{
		value: 'xyz-transport',
		label: 'XYZ Transport',
		description: 'Broker • Atlanta, GA',
	},
];

const createMockFormik = (
	overrides: Partial<FormikFieldProps> = {},
): FormikFieldProps => ({
	values: { broker: '' },
	errors: {},
	touched: {},
	handleChange: jest.fn(),
	handleBlur: jest.fn(),
	setFieldValue: jest.fn(),
	...overrides,
});

describe('TypeaheadField', () => {
	it('renders with label', () => {
		const formik = createMockFormik();

		render(
			<TypeaheadField
				name='broker'
				label='Broker'
				options={mockOptions}
				formik={formik}
			/>,
		);

		expect(screen.getByLabelText(/broker/i)).toBeInTheDocument();
	});

	it('calls setFieldValue with selected option value', async () => {
		const user = userEvent.setup();
		const setFieldValue = jest.fn();
		const formik = createMockFormik({ setFieldValue });

		render(
			<TypeaheadField
				name='broker'
				label='Broker'
				options={mockOptions}
				formik={formik}
			/>,
		);

		const input = screen.getByRole('combobox', { name: /broker/i });
		await user.click(input);
		await user.click(screen.getByRole('option', { name: /abc logistics/i }));

		expect(setFieldValue).toHaveBeenCalledWith('broker', 'abc-logistics');
	});

	it('supports free text input when allowFreeText is enabled', async () => {
		const user = userEvent.setup();
		const setFieldValue = jest.fn();
		const formik = createMockFormik({ setFieldValue });

		render(
			<TypeaheadField
				name='broker'
				label='Broker'
				options={mockOptions}
				formik={formik}
				allowFreeText
			/>,
		);

		const input = screen.getByRole('combobox', { name: /broker/i });
		await user.type(input, 'New Broker');

		expect(setFieldValue).toHaveBeenCalledWith('broker', 'New Broker');
	});

	it('renders custom option content when provided', async () => {
		const user = userEvent.setup();
		const formik = createMockFormik();

		render(
			<TypeaheadField
				name='broker'
				label='Broker'
				options={mockOptions}
				formik={formik}
				renderOptionContent={(option) => (
					<Box>
						<Typography variant='body2'>{option.label}</Typography>
						<Typography variant='caption'>{option.description}</Typography>
					</Box>
				)}
			/>,
		);

		const input = screen.getByRole('combobox', { name: /broker/i });
		await user.click(input);

		expect(screen.getByText('Broker • Tampa, FL')).toBeInTheDocument();
		expect(screen.getByText('Broker • Atlanta, GA')).toBeInTheDocument();
	});

	it('renders dropdown action button when configured and triggers callback', async () => {
		const user = userEvent.setup();
		const onActionButtonClick = jest.fn();
		const formik = createMockFormik();

		render(
			<TypeaheadField
				name='broker'
				label='Broker'
				options={mockOptions}
				formik={formik}
				actionButtonLabel='Add Broker'
				onActionButtonClick={onActionButtonClick}
			/>,
		);

		const input = screen.getByRole('combobox', { name: /broker/i });
		await user.click(input);

		const actionButton = screen.getByRole('button', { name: /add broker/i });
		await user.click(actionButton);

		expect(onActionButtonClick).toHaveBeenCalledTimes(1);
	});
});
