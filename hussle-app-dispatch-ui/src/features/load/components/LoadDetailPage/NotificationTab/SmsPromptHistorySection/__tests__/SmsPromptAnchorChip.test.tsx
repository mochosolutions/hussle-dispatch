import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SmsPromptAnchorChip } from '../SmsPromptAnchorChip';

const renderChip = (anchor: React.ComponentProps<typeof SmsPromptAnchorChip>['anchor']) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <SmsPromptAnchorChip anchor={anchor} />
    </ThemeProvider>,
  );

describe('SmsPromptAnchorChip', () => {
  it('renders the humanized label for each anchor', () => {
    renderChip('DISPATCHED');
    expect(screen.getByText('Dispatched')).toBeInTheDocument();
  });

  it('applies the expected MUI color class for each anchor', () => {
    const cases: {
      anchor: React.ComponentProps<typeof SmsPromptAnchorChip>['anchor'];
      color: string;
    }[] = [
      { anchor: 'DISPATCHED', color: 'MuiChip-colorInfo' },
      { anchor: 'PRE_PICKUP', color: 'MuiChip-colorWarning' },
      { anchor: 'POST_PICKUP', color: 'MuiChip-colorError' },
      { anchor: 'TRANSIT_INTERVAL', color: 'MuiChip-colorDefault' },
      { anchor: 'MANUAL', color: 'MuiChip-colorPrimary' },
    ];

    cases.forEach(({ anchor, color }) => {
      const { container, unmount } = renderChip(anchor);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).not.toBeNull();
      expect(chip?.className).toContain(color);
      unmount();
    });
  });
});
