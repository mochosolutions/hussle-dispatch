import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubmitButton } from './index';

describe('SubmitButton', () => {
  it('renders with label', () => {
    render(<SubmitButton label="Login" loading={false} />);

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('has submit type by default', () => {
    render(<SubmitButton label="Submit" loading={false} />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('can render with button type', () => {
    render(<SubmitButton label="Click Me" loading={false} type="button" />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('is disabled when loading', () => {
    render(<SubmitButton label="Submit" loading={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<SubmitButton label="Submit" loading={false} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when both loading and disabled', () => {
    render(<SubmitButton label="Submit" loading={true} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is not disabled when loading is false and disabled is false', () => {
    render(<SubmitButton label="Submit" loading={false} disabled={false} />);

    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders full width by default', () => {
    const { container } = render(<SubmitButton label="Submit" loading={false} />);

    // MUI LoadingButton with fullWidth
    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiButton-fullWidth');
  });

  it('can render without full width', () => {
    const { container } = render(
      <SubmitButton label="Submit" loading={false} fullWidth={false} />
    );

    const button = container.querySelector('button');
    expect(button).not.toHaveClass('MuiButton-fullWidth');
  });

  it('renders with large size by default', () => {
    const { container } = render(<SubmitButton label="Submit" loading={false} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('MuiButton-sizeLarge');
  });

  it('can render with different sizes', () => {
    const { container: containerSmall } = render(
      <SubmitButton label="Submit" loading={false} size="small" />
    );
    const { container: containerMedium } = render(
      <SubmitButton label="Submit" loading={false} size="medium" />
    );

    expect(containerSmall.querySelector('button')).toHaveClass('MuiButton-sizeSmall');
    expect(containerMedium.querySelector('button')).toHaveClass('MuiButton-sizeMedium');
  });
});
