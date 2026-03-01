import { ReactElement } from 'react';
import { RenderOptions } from '@testing-library/react';
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
declare function customRender(ui: ReactElement, { themeMode, ...renderOptions }?: CustomRenderOptions): import('@testing-library/react').RenderResult<typeof import("@testing-library/dom/types/queries"), HTMLElement, HTMLElement>;
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
//# sourceMappingURL=test-utils.d.ts.map