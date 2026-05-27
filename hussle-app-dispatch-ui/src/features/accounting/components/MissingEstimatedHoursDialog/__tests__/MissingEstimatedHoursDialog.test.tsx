import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { MissingEstimatedHoursDialog } from '../index';

const renderDialog = (
  props: Partial<ComponentProps<typeof MissingEstimatedHoursDialog>> = {},
) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme()}>
        <MissingEstimatedHoursDialog
          loadIds={[]}
          loads={[]}
          message=""
          onClose={() => {}}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('MissingEstimatedHoursDialog', () => {
  it('renders the dialog with message and load links', () => {
    renderDialog({
      loadIds: ['load-1', 'load-2'],
      loads: [
        { id: 'load-1', loadNumber: 'L-001' },
        { id: 'load-2', loadNumber: 'L-002' },
      ],
      message: 'Two loads missing estimated hours',
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Two loads missing estimated hours')).toBeInTheDocument();

    const link1 = screen.getByRole('link', { name: '#L-001' });
    const link2 = screen.getByRole('link', { name: '#L-002' });
    expect(link1).toHaveAttribute('href', '/loads/load-1');
    expect(link2).toHaveAttribute('href', '/loads/load-2');
  });

  it('invokes onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    renderDialog({ message: 'Missing hours', onClose });

    screen.getByRole('button', { name: /close/i }).click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
