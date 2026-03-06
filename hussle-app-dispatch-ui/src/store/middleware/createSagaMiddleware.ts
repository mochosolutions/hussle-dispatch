import createSagaMiddleware from 'redux-saga';
import type { NavigateFunction } from 'react-router-dom';

let navigate: NavigateFunction | undefined;

export const setNavigate = (navFn: NavigateFunction) => {
  navigate = navFn;
};

export const getNavigate = () => {
  if (!navigate) {
    throw new Error('Navigate function not set.');
  }
  return navigate;
};

// Create a custom context-aware saga middleware
export const createSagaMiddlewareWithNavigation = () => {
  const sagaMiddleware = createSagaMiddleware({
    context: {
      navigate: () => {
        const navFn = getNavigate();
        return navFn;
      },
    },
  });

  return sagaMiddleware;
};

export default createSagaMiddlewareWithNavigation;
