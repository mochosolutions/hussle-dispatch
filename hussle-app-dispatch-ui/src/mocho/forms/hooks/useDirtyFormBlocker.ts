import { useEffect } from 'react';
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
  // Block in-app navigation when form is dirty and not submitting.
  // When submitting, user intends to save and leave, so don't block.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  );

  // Show confirmation dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked' && onBlock) {
      onBlock(blocker, title, message);
    }
  }, [blocker.state, blocker, title, message, onBlock]);

  // Handle browser refresh/close with native dialog
  useEffect(() => {
    if (isDirty && !isSubmitting) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for some browsers
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isDirty, isSubmitting]);

  return blocker;
};

export default useDirtyFormBlocker;
