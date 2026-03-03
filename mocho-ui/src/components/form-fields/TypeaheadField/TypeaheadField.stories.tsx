import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { TypeaheadField } from './index';

const meta: Meta<typeof TypeaheadField> = {
	title: 'Components/Form Fields/TypeaheadField',
	component: TypeaheadField,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TypeaheadField>;

const brokerOptions = [
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
	{
		value: 'fast-freight',
		label: 'Fast Freight Co.',
		description: 'Broker • Dallas, TX',
	},
	{
		value: 'northstar-lines',
		label: 'Northstar Lines',
		description: 'Broker • Chicago, IL',
	},
];

export const Default: Story = {
	render: () => {
		return (
			<Formik
				initialValues={{ broker: '' }}
				validationSchema={Yup.object({
					broker: Yup.string().required('Broker is required'),
				})}
				onSubmit={() => {}}
			>
				{(formik) => (
					<Form>
						<Stack spacing={2} sx={{ width: 420 }}>
							<TypeaheadField
								name='broker'
								label='Broker'
								options={brokerOptions}
								placeholder='Search broker by name'
								required
								formik={formik}
							/>
						</Stack>
					</Form>
				)}
			</Formik>
		);
	},
};

export const FreeTextAndAction: Story = {
	render: () => {
		return (
			<Formik initialValues={{ broker: '' }} onSubmit={() => {}}>
				{(formik) => (
					<Form>
						<Stack spacing={2} sx={{ width: 420 }}>
							<Alert severity='info'>
								Try typing a new broker name, or click "Add New Broker" in the
								dropdown.
							</Alert>

							<TypeaheadField
								name='broker'
								label='Broker'
								options={brokerOptions}
								placeholder='Type or select a broker'
								allowFreeText
								actionButtonLabel='Add New Broker'
								onActionButtonClick={() => {
									window.alert('Add New Broker clicked');
								}}
								renderOptionContent={(option) => (
									<Stack spacing={0.25}>
										<Typography variant='body2'>{option.label}</Typography>
										{option.description ? (
											<Typography color='text.secondary' variant='caption'>
												{option.description}
											</Typography>
										) : null}
									</Stack>
								)}
								formik={formik}
							/>

							<Typography variant='caption'>
								Current value: {formik.values.broker || '(empty)'}
							</Typography>

							<Button type='submit' variant='contained'>
								Submit
							</Button>
						</Stack>
					</Form>
				)}
			</Formik>
		);
	},
};
