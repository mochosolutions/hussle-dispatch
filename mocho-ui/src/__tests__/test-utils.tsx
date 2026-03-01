import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import ThemeCustomization from '../theme';
import { ThemeMode } from '../types/config';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  themeMode?: ThemeMode;
}

/**
 * Custom render function that wraps components with ThemeCustomization provider.
 * Use this instead of @testing-library/react's render for component tests.
 *
 * @example
 * ```tsx
 * import { render, screen } from '../__tests__/test-utils';
 *
 * test('renders MainCard', () => {
 *   render(<MainCard title="Test">Content</MainCard>);
 *   expect(screen.getByText('Test')).toBeInTheDocument();
 * });
 * ```
 */
function customRender(
  ui: ReactElement,
  { themeMode = ThemeMode.LIGHT, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeCustomization mode={themeMode}>
        {children}
      </ThemeCustomization>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };
