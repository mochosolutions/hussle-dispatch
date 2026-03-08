import { useEffect } from 'react';
import { useBlocker, Blocker } from 'react-router-dom';

interface UseDirtyFormBlockerOptions {
  isDirty: boolean;
  isSubmitting?: boolean;
  onBlock: (blocker: Blocker) => void;
  /** @default window */
  _window?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  /** @default import.meta.env.DEV */
  _isDev?: boolean;
}

/**
 * Blocks navigation when a form has unsaved changes.
 * Lives at the page level, edit pages only.
 *
 * Handles two scenarios:
 * - In-app navigation via React Router's useBlocker
 * - Browser refresh/close via beforeunload
 *
 * Decoupled from Redux — pass onBlock to handle the blocked state
 * however your app needs (modal, confirm dialog, etc).
 *
 * @example
 * ```tsx
 * useDirtyFormBlocker({
 *   isDirty: formState.isDirty,
 *   isSubmitting: formState.isSubmitting,
 *   onBlock: (blocker) => dispatch(openModal({
 *     modalType: 'dirtyFormConfirm',
 *     modalProps: { blocker },
 *   })),
 * });
 * ```
 */
export function useDirtyFormBlocker({
  isDirty,
  isSubmitting = false,
  onBlock,
  _window = window,
  _isDev = true,
}: UseDirtyFormBlockerOptions) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      onBlock(blocker);
    }
  }, [blocker.state, blocker, onBlock]);

  useEffect(() => {
    if (_isDev) return;
    if (isDirty && !isSubmitting) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      _window.addEventListener('beforeunload', handler);
      return () => _window.removeEventListener('beforeunload', handler);
    }
  }, [isDirty, isSubmitting, _window, _isDev]);

  return blocker;
}

export default useDirtyFormBlocker;