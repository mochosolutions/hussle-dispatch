import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AgreementContext } from 'features/carrier-portal/engine';
import ConfirmReSignDialog from '.';

const signedDispatch: AgreementContext = {
  id: 'agr-1',
  templateKey: 'DISPATCH_AGREEMENT',
  status: 'SIGNED',
  signedAt: '2026-05-20T15:00:00Z',
};

describe('ConfirmReSignDialog', () => {
  it('does not render content when open=false', () => {
    render(
      <ConfirmReSignDialog
        open={false}
        changedFields={['legalName']}
        affectedAgreements={[signedDispatch]}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByText(/Re-sign required/)).not.toBeInTheDocument();
  });

  it('renders the changed field name and affected agreement title', () => {
    render(
      <ConfirmReSignDialog
        open
        changedFields={['legalName']}
        affectedAgreements={[signedDispatch]}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText('Re-sign required')).toBeInTheDocument();
    expect(screen.getByText('legal name')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Services Agreement')).toBeInTheDocument();
  });

  it('lists multiple changed fields with "and" separator', () => {
    render(
      <ConfirmReSignDialog
        open
        changedFields={['legalName', 'mcNumber']}
        affectedAgreements={[signedDispatch]}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText('legal name and MC number')).toBeInTheDocument();
  });

  it('fires onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(
      <ConfirmReSignDialog
        open
        changedFields={['legalName']}
        affectedAgreements={[signedDispatch]}
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('fires onConfirm when "Continue and re-sign" is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(
      <ConfirmReSignDialog
        open
        changedFields={['mcNumber']}
        affectedAgreements={[signedDispatch]}
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole('button', { name: /continue and re-sign/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
