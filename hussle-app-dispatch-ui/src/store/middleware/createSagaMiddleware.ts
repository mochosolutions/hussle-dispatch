import createSagaMiddleware from 'redux-saga';

let navigate;

export const setNavigate = (navFn) => {
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
