import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { createReduxDecorator, createStoryStore, ReduxDecoratorConfig } from '../ReduxDecorator';
import { openModal, closeModal, UIState } from '../../../src/store/reducers/ui';

// Test component that interacts with Redux
function TestComponent() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: { ui: UIState }) => state.ui.modal.isOpen);

  return (
    <div>
      <span data-testid="modal-state">{isModalOpen ? 'open' : 'closed'}</span>
      <button onClick={() => dispatch(openModal({ modalType: 'test', modalProps: { title: 'Test' } }))}>
        Open Modal
      </button>
      <button onClick={() => dispatch(closeModal())}>Close Modal</button>
    </div>
  );
}

describe('createStoryStore', () => {
  it('creates a store with default reducers', () => {
    const store = createStoryStore();
    const state = store.getState();

    expect(state).toHaveProperty('ui');
    expect(state.ui.modal.isOpen).toBe(false);
  });

  it('creates a store with custom reducers', () => {
    const customReducer = (state = { value: 42 }) => state;
    const store = createStoryStore({
      reducers: {
        custom: customReducer,
      },
    });

    const state = store.getState();
    expect(state).toHaveProperty('custom');
    expect(state.custom.value).toBe(42);
  });

  it('creates a store with preloaded state', () => {
    const store = createStoryStore({
      preloadedState: {
        ui: {
          modal: {
            isOpen: true,
            modalType: 'test',
            modalProps: null,
          },
        },
      },
    });

    const state = store.getState();
    expect(state.ui.modal.isOpen).toBe(true);
    expect(state.ui.modal.modalType).toBe('test');
  });

  it('creates store with saga middleware', () => {
    const store = createStoryStore();
    // The store should have dispatch capability
    expect(typeof store.dispatch).toBe('function');
  });
});

describe('createReduxDecorator', () => {
  it('wraps story in Redux Provider', () => {
    const ReduxDecorator = createReduxDecorator();

    render(
      ReduxDecorator(
        () => <TestComponent />,
        { args: {}, globals: {}, parameters: {} } as any
      ) as JSX.Element
    );

    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed');
  });

  it('allows dispatching actions through the store', () => {
    const ReduxDecorator = createReduxDecorator();

    render(
      ReduxDecorator(
        () => <TestComponent />,
        { args: {}, globals: {}, parameters: {} } as any
      ) as JSX.Element
    );

    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('open');

    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed');
  });

  it('creates isolated stores for each story', () => {
    const ReduxDecorator = createReduxDecorator();

    // First story
    const { unmount } = render(
      ReduxDecorator(
        () => <TestComponent />,
        { args: {}, globals: {}, parameters: {} } as any
      ) as JSX.Element
    );
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('open');
    unmount();

    // Second story - should start fresh
    render(
      ReduxDecorator(
        () => <TestComponent />,
        { args: {}, globals: {}, parameters: {} } as any
      ) as JSX.Element
    );
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed');
  });

  it('accepts custom configuration', () => {
    const config: ReduxDecoratorConfig = {
      preloadedState: {
        ui: {
          modal: {
            isOpen: true,
            modalType: 'preloaded',
            modalProps: null,
          },
        },
      },
    };

    const ReduxDecorator = createReduxDecorator(config);

    render(
      ReduxDecorator(
        () => <TestComponent />,
        { args: {}, globals: {}, parameters: {} } as any
      ) as JSX.Element
    );

    expect(screen.getByTestId('modal-state')).toHaveTextContent('open');
  });

  it('includes SnackbarProvider', () => {
    const ReduxDecorator = createReduxDecorator();

    // The decorator should wrap with SnackbarProvider for toast notifications
    // This test verifies the provider is present by not throwing
    expect(() =>
      render(
        ReduxDecorator(
          () => <div>Test</div>,
          { args: {}, globals: {}, parameters: {} } as any
        ) as JSX.Element
      )
    ).not.toThrow();
  });
});
