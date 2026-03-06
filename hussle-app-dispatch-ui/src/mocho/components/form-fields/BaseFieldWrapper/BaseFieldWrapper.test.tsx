import React from 'react';
import { render, screen } from '@testing-library/react';
import { BaseFieldWrapper } from './index';

describe('BaseFieldWrapper', () => {
  it('renders label with correct htmlFor attribute', () => {
    render(
      <BaseFieldWrapper name="email" label="Email Address">
        <input id="email" />
      </BaseFieldWrapper>
    );

    const label = screen.getByText('Email Address');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'email');
  });

  it('renders children correctly', () => {
    render(
      <BaseFieldWrapper name="test" label="Test Field">
        <input data-testid="child-input" />
      </BaseFieldWrapper>
    );

    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('shows required asterisk when required is true', () => {
    render(
      <BaseFieldWrapper name="email" label="Email Address" required>
        <input id="email" />
      </BaseFieldWrapper>
    );

    const label = screen.getByText('Email Address');
    expect(label).toBeInTheDocument();
    // MUI InputLabel with required adds aria-hidden asterisk
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
  });

  it('does not show required asterisk when required is false', () => {
    render(
      <BaseFieldWrapper name="email" label="Email Address" required={false}>
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('displays error message when touched and error is provided', () => {
    render(
      <BaseFieldWrapper
        name="email"
        label="Email Address"
        error="Email is required"
        touched
      >
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('does not display error message when not touched', () => {
    render(
      <BaseFieldWrapper
        name="email"
        label="Email Address"
        error="Email is required"
        touched={false}
      >
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('does not display error message when no error provided', () => {
    render(
      <BaseFieldWrapper name="email" label="Email Address" touched>
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays helper text when provided and no error', () => {
    render(
      <BaseFieldWrapper
        name="email"
        label="Email Address"
        helperText="Enter your email address"
      >
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('shows error message instead of helper text when both are provided and touched', () => {
    render(
      <BaseFieldWrapper
        name="email"
        label="Email Address"
        error="Email is required"
        touched
        helperText="Enter your email address"
      >
        <input id="email" />
      </BaseFieldWrapper>
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
  });

  it('uses name for error helper text id', () => {
    render(
      <BaseFieldWrapper
        name="username"
        label="Username"
        error="Username is required"
        touched
      >
        <input id="username" />
      </BaseFieldWrapper>
    );

    const helperText = screen.getByText('Username is required');
    expect(helperText).toHaveAttribute('id', 'helper-text-username');
  });
});
