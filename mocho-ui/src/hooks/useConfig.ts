import { useLayoutConfig } from '../components/layout/LayoutContext';
import type { CustomizationProps } from '../types/config';

/**
 * Hook to access theme/layout configuration
 *
 * Must be used within a LayoutProvider
 */
export function useConfig(): CustomizationProps {
  return useLayoutConfig();
}

export default useConfig;
