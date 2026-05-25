import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AgreementSignedInterstitial from '.';

describe('AgreementSignedInterstitial', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the signed agreement name + a formatted signedAt', () => {
    render(
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        onBackToList={jest.fn()}
      />,
    );
    expect(screen.getByText('Dispatch Services Agreement')).toBeInTheDocument();
    // Don't pin exact format string — just confirm something was rendered for the timestamp.
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('calls onAutoAdvance after autoAdvanceMs when nextAgreementName is provided', () => {
    const onAutoAdvance = jest.fn();
    render(
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        nextAgreementName="Broker-Carrier Master Agreement"
        onAutoAdvance={onAutoAdvance}
        onBackToList={jest.fn()}
        autoAdvanceMs={2000}
      />,
    );

    expect(onAutoAdvance).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onAutoAdvance).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onAutoAdvance when nextAgreementName is absent', () => {
    const onAutoAdvance = jest.fn();
    render(
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        onAutoAdvance={onAutoAdvance}
        onBackToList={jest.fn()}
        autoAdvanceMs={2000}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onAutoAdvance).not.toHaveBeenCalled();
  });

  it('renders the Up next block when nextAgreementName is provided', () => {
    render(
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        nextAgreementName="W-9"
        onBackToList={jest.fn()}
      />,
    );
    expect(screen.getByText(/Up next/i)).toBeInTheDocument();
    expect(screen.getByText('W-9')).toBeInTheDocument();
  });

  it('invokes onBackToList when the back-to-list button is clicked', async () => {
    jest.useRealTimers();
    const handler = jest.fn();
    render(
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        onBackToList={handler}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /back to list/i }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
