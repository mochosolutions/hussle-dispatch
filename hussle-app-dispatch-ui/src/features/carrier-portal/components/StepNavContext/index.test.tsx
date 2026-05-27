import { useMemo } from 'react';
import { render, screen } from '@testing-library/react';

import {
  TestStepChromeProvider,
  useStepChromeOverride,
  type StepChromeTestHandle,
} from './index';

const HarnessFocus: React.FC<{ label: string }> = ({ label }) => {
  const stepperSlot = useMemo(() => <div>{`stepper:${label}`}</div>, [label]);
  const footerSlot = useMemo(() => <div>{`footer:${label}`}</div>, [label]);
  useStepChromeOverride({ stepperSlot, footerSlot });
  return null;
};

const HarnessNoRegistration: React.FC = () => null;

describe('useStepChromeOverride + TestStepChromeProvider', () => {
  it('registers slots and renders them via the test provider', () => {
    const handle: StepChromeTestHandle = { current: null };
    render(
      <TestStepChromeProvider handle={handle}>
        <HarnessFocus label="A" />
      </TestStepChromeProvider>,
    );
    expect(screen.getByTestId('test-chrome-stepper')).toHaveTextContent('stepper:A');
    expect(screen.getByTestId('test-chrome-footer')).toHaveTextContent('footer:A');
    expect(handle.current).toEqual({
      stepperSlot: expect.anything(),
      footerSlot: expect.anything(),
    });
  });

  it('clears overrides on unmount', () => {
    const handle: StepChromeTestHandle = { current: null };
    const { unmount } = render(
      <TestStepChromeProvider handle={handle}>
        <HarnessFocus label="A" />
      </TestStepChromeProvider>,
    );
    unmount();
    expect(handle.current).toBeNull();
  });

  it('omits the test-chrome-* divs when no slot is registered', () => {
    render(
      <TestStepChromeProvider>
        <HarnessNoRegistration />
      </TestStepChromeProvider>,
    );
    expect(screen.queryByTestId('test-chrome-stepper')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-chrome-footer')).not.toBeInTheDocument();
  });
});
