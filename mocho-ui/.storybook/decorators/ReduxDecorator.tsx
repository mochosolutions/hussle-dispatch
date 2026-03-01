/**
 * Redux Decorator for Storybook
 *
 * Provides isolated Redux stores for each story with:
 * - Saga middleware support
 * - Notistack for toast notifications
 * - ConfirmDialog integration for saga confirmation flows
 * - Navigation mocking
 */

import React, { useMemo, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, combineReducers, Reducer, AnyAction, Store } from '@reduxjs/toolkit';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import { SnackbarProvider } from 'notistack';
import type { Decorator } from '@storybook/react';
import { uiReducer, UIState, closeModal } from '../../src/store/reducers/ui';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import { setNavigate, clearNavigate } from '../../src/utils/getNavigate';

/**
 * Configuration options for the Redux decorator
 */
export interface ReduxDecoratorConfig {
  /** Additional reducers to include in the store */
  reducers?: Record<string, Reducer>;
  /** Preloaded state for the store */
  preloadedState?: Record<string, unknown>;
  /** Root saga to run (optional) */
  rootSaga?: () => Generator;
  /** Custom navigate function for navigation mocking */
  onNavigate?: (path: string) => void;
}

/**
 * Creates an isolated Redux store for a story
 */
export function createStoryStore(config: ReduxDecoratorConfig = {}): Store & {
  sagaMiddleware: SagaMiddleware;
} {
  const { reducers = {}, preloadedState = {} } = config;

  const sagaMiddleware = createSagaMiddleware();

  const rootReducer = combineReducers({
    ui: uiReducer,
    ...reducers,
  });

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
      }).concat(sagaMiddleware),
    preloadedState: preloadedState as ReturnType<typeof rootReducer>,
  });

  return Object.assign(store, { sagaMiddleware });
}

/**
 * Component that renders the ConfirmDialog connected to Redux state
 */
function ConnectedConfirmDialog() {
  const dispatch = useDispatch();
  const modalState = useSelector((state: { ui: UIState }) => state.ui.modal);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleConfirm = () => {
    // The confirm action type is stored in modalProps
    const confirmActionType = modalState.modalProps?.confirmActionType as string | undefined;
    if (confirmActionType) {
      dispatch({ type: confirmActionType, payload: modalState.modalProps?.confirmPayload });
    }
    dispatch(closeModal());
  };

  if (modalState.modalType !== 'confirmDialog') {
    return null;
  }

  return (
    <ConfirmDialog
      open={modalState.isOpen}
      title={modalState.modalProps?.title || 'Confirm'}
      message={modalState.modalProps?.message as string | undefined}
      content={modalState.modalProps?.content as string | undefined}
      confirmLabel={modalState.modalProps?.confirmLabel}
      cancelLabel={modalState.modalProps?.cancelLabel}
      severity={modalState.modalProps?.severity as 'warning' | 'error' | 'info' | undefined}
      onConfirm={handleConfirm}
      onClose={handleClose}
    />
  );
}

/**
 * Internal wrapper component that sets up navigation and renders children
 */
interface StoryWrapperProps {
  children: React.ReactNode;
  onNavigate?: (path: string) => void;
  rootSaga?: () => Generator;
  sagaMiddleware: SagaMiddleware;
}

function StoryWrapper({ children, onNavigate, rootSaga, sagaMiddleware }: StoryWrapperProps) {
  useEffect(() => {
    // Set up navigation mock
    const navigateFn = onNavigate || ((path: string) => {
      console.log('[Storybook Navigation]', path);
    });
    setNavigate(navigateFn);

    // Run root saga if provided
    let sagaTask: ReturnType<SagaMiddleware['run']> | null = null;
    if (rootSaga) {
      sagaTask = sagaMiddleware.run(rootSaga);
    }

    return () => {
      clearNavigate();
      if (sagaTask) {
        sagaTask.cancel();
      }
    };
  }, [onNavigate, rootSaga, sagaMiddleware]);

  return <>{children}</>;
}

/**
 * Internal component that wraps the story with all providers
 * This allows us to use hooks inside a proper React component context
 */
interface ReduxDecoratorWrapperProps {
  config: ReduxDecoratorConfig;
  children: React.ReactNode;
}

function ReduxDecoratorWrapper({ config, children }: ReduxDecoratorWrapperProps) {
  const storeWithMiddleware = useMemo(() => createStoryStore(config), [config]);

  return (
    <Provider store={storeWithMiddleware}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <StoryWrapper
          onNavigate={config.onNavigate}
          rootSaga={config.rootSaga}
          sagaMiddleware={storeWithMiddleware.sagaMiddleware}
        >
          {children}
          <ConnectedConfirmDialog />
        </StoryWrapper>
      </SnackbarProvider>
    </Provider>
  );
}

/**
 * Creates a Storybook decorator that wraps stories with Redux Provider
 *
 * @param config - Configuration options
 * @returns Storybook decorator function
 *
 * @example
 * ```tsx
 * // In a story file
 * export default {
 *   decorators: [
 *     createReduxDecorator({
 *       reducers: { mySlice: mySliceReducer },
 *       preloadedState: { mySlice: { value: 42 } },
 *     }),
 *   ],
 * };
 * ```
 */
export function createReduxDecorator(config: ReduxDecoratorConfig = {}): Decorator {
  return (Story, context) => {
    return (
      <ReduxDecoratorWrapper config={config}>
        <Story />
      </ReduxDecoratorWrapper>
    );
  };
}

/**
 * Default Redux decorator with basic configuration
 * Use this for stories that just need Redux without custom configuration
 */
export const ReduxDecorator = createReduxDecorator();
