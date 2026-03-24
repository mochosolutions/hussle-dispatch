import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';

interface UseDirtyFormBlockerOptions {
  /**
   * Whether the form has unsaved changes
   */
  isDirty: boolean;

  /**
   * Whether the form is currently submitting.
   * When true, navigation will be allowed (user is saving and leaving).
   */
  isSubmitting?: boolean;

  /**
   * Custom message to show in the confirmation dialog
   */
  message?: string;

  /**
   * Custom title for the confirmation dialog
   */
  title?: string;

  /**
   * Callback to open a modal dialog when navigation is blocked.
   * If not provided, only browser-level blocking will be active.
   */
  onBlock?: (blocker: Blocker, title: string, message: string) => void;
}

/**
 * Hook to block navigation when a form has unsaved changes.
 *
 * Uses React Router's `useBlocker` for in-app navigation blocking
 * and `beforeunload` event for browser-level navigation (refresh, close).
 *
 * Requires a data router (createBrowserRouter) to work.
 *
 * @example
 * ```tsx
 * // Basic usage (browser-level blocking only)
 * const EditPage = () => {
 *   const [formState, setFormState] = useState({ isDirty: false });
 *   useDirtyFormBlocker({ isDirty: formState.isDirty });
 *   // ...
 * };
 *
 * // With modal integration
 * const EditPage = () => {
 *   const dispatch = useDispatch();
 *   const [formState, setFormState] = useState({ isDirty: false });
 *
 *   useDirtyFormBlocker({
 *     isDirty: formState.isDirty,
 *     onBlock: (blocker, title, message) => {
 *       dispatch(openModal({
 *         modalType: 'dirtyFormConfirm',
 *         modalProps: { blocker, title, message },
 *       }));
 *     },
 *   });
 *   // ...
 * };
 * ```
 *
 * @param options - Configuration options
 * @returns The blocker object from React Router
 */
export const useDirtyFormBlocker = ({
  isDirty,
  isSubmitting = false,
  message = 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
  title = 'Unsaved Changes',
  onBlock,
}: UseDirtyFormBlockerOptions): Blocker => {
  // Store callbacks in refs so they never destabilize the effect or blocker.
  const onBlockRef = useRef(onBlock);
  onBlockRef.current = onBlock;

  const titleRef = useRef(title);
  titleRef.current = title;

  const messageRef = useRef(message);
  messageRef.current = message;

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  // Stable function reference — reads current values from refs so the
  // callback identity never changes across renders.
  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
      isDirtyRef.current &&
      !isSubmittingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
    [],
  );

  const blocker = useBlocker(shouldBlock);

  // Show confirmation dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked' && onBlockRef.current) {
      onBlockRef.current(blocker, titleRef.current, messageRef.current);
    }
  }, [blocker.state, blocker]);

  // Handle browser refresh/close with native dialog
  useEffect(() => {
    if (isDirty && !isSubmitting) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isDirty, isSubmitting]);

  return blocker;
};

export default useDirtyFormBlocker;
