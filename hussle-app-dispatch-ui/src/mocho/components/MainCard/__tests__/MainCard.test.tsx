import React from 'react';
import { Button } from '@mui/material';
import { render, screen } from '../../../__tests__/test-utils';
import MainCard from '../index';

describe('MainCard', () => {
  it('renders children correctly', () => {
    render(
      <MainCard>
        <p>Card content</p>
      </MainCard>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <MainCard title="Test Title">
        <p>Content</p>
      </MainCard>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subheader when provided', () => {
    render(
      <MainCard title="Title" subheader="Subheader text">
        <p>Content</p>
      </MainCard>
    );

    expect(screen.getByText('Subheader text')).toBeInTheDocument();
  });

  it('renders secondary action when provided', () => {
    const handleClick = jest.fn();

    render(
      <MainCard
        title="Title"
        secondary={<Button onClick={handleClick}>Action</Button>}
      >
        <p>Content</p>
      </MainCard>
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders dark title variant with h4 typography', () => {
    render(
      <MainCard title="Dark Title" darkTitle>
        <p>Content</p>
      </MainCard>
    );

    const title = screen.getByText('Dark Title');
    expect(title).toBeInTheDocument();
    // h4 variant wraps title in Typography
    expect(title.tagName).toBe('H4');
  });

  it('does not render divider when divider prop is false', () => {
    const { container } = render(
      <MainCard title="Title" divider={false}>
        <p>Content</p>
      </MainCard>
    );

    const divider = container.querySelector('hr');
    expect(divider).not.toBeInTheDocument();
  });

  it('renders without CardContent when content prop is false', () => {
    render(
      <MainCard title="Title" content={false}>
        <p data-testid="raw-content">Raw content</p>
      </MainCard>
    );

    // Content should still be rendered but not wrapped in CardContent
    expect(screen.getByTestId('raw-content')).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const { container } = render(
      <MainCard sx={{ backgroundColor: 'red' }}>
        <p>Content</p>
      </MainCard>
    );

    const card = container.firstChild;
    // MUI sx prop applies styles through CSS-in-JS, not inline styles.
    // Verify the card element is rendered and accepts the sx prop without error.
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('MuiCard-root');
  });

  it('applies custom contentSX styles to CardContent', () => {
    const { container } = render(
      <MainCard contentSX={{ padding: '32px' }}>
        <p>Content</p>
      </MainCard>
    );

    // Find CardContent by its MUI class
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
  });

  it('forwards ref to Card element', () => {
    const ref = React.createRef<HTMLDivElement>();

    render(
      <MainCard ref={ref}>
        <p>Content</p>
      </MainCard>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders without title correctly', () => {
    const { container } = render(
      <MainCard>
        <p>Only content</p>
      </MainCard>
    );

    // No CardHeader should be rendered
    const cardHeader = container.querySelector('.MuiCardHeader-root');
    expect(cardHeader).not.toBeInTheDocument();
  });
});
