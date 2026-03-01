import { Blocker } from 'react-router-dom';
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
export declare const useDirtyFormBlocker: ({ isDirty, isSubmitting, message, title, onBlock, }: UseDirtyFormBlockerOptions) => Blocker;
export default useDirtyFormBlocker;
//# sourceMappingURL=useDirtyFormBlocker.d.ts.map