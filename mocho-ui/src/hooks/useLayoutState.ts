import { useContext } from 'react';

import { LayoutStateContext } from '../contexts/LayoutStateContext';
import type { LayoutStateContextValue } from '../contexts/LayoutStateContext';

const useLayoutState = (): LayoutStateContextValue => {
  const context = useContext(LayoutStateContext);
  if (context === null) {
    throw new Error('useLayoutState must be used within a LayoutStateProvider');
  }
  return context;
};

export default useLayoutState;
