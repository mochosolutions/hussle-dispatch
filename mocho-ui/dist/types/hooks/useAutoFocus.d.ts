import { RefObject } from 'react';
/**
 * Configuration for useAutoFocus hook
 */
export interface UseAutoFocusOptions {
    /**
     * Enable auto-focus (default: true)
     */
    enabled?: boolean;
    /**
     * Delay before focusing in milliseconds (default: 100)
     * Useful for avoiding focus conflicts with animations/transitions
     */
    delay?: number;
    /**
     * Select all text after focusing (default: false)
     * Useful for edit forms where user might want to replace existing value
     */
    selectOnFocus?: boolean;
    /**
     * Focus only if element is visible (default: true)
     */
    checkVisibility?: boolean;
}
/**
 * useAutoFocus Hook
 *
 * Automatically focuses an input/textarea/select element when component mounts.
 * Improves accessibility and user experience by reducing keyboard navigation.
 *
 * **Features:**
 * - Configurable delay for animations/transitions
 * - Optional text selection on focus
 * - Visibility check to avoid focusing hidden elements
 * - Works with any focusable element (input, textarea, select, button)
 * - TypeScript generic for type-safe refs
 *
 * **Usage:**
 * ```typescript
 * // Basic usage
 * function MyForm() {
 *   const inputRef = useAutoFocus<HTMLInputElement>();
 *
 *   return <input ref={inputRef} type="text" />;
 * }
 *
 * // With options
 * function MyEditForm() {
 *   const inputRef = useAutoFocus<HTMLInputElement>({
 *     delay: 200,
 *     selectOnFocus: true, // Select existing text for easy replacement
 *   });
 *
 *   return <input ref={inputRef} type="text" defaultValue="Existing value" />;
 * }
 *
 * // Conditional focus
 * function MyForm({ autoFocus }: { autoFocus: boolean }) {
 *   const inputRef = useAutoFocus<HTMLInputElement>({
 *     enabled: autoFocus,
 *   });
 *
 *   return <input ref={inputRef} type="text" />;
 * }
 * ```
 *
 * **WCAG 2.1 Compliance:**
 * - Improves keyboard navigation (Success Criterion 2.1.1)
 * - Reduces interaction steps for users with motor disabilities
 * - Respects user preferences (can be disabled via `enabled` option)
 *
 * @param options - Configuration options
 * @returns Ref to attach to the focusable element
 */
export declare function useAutoFocus<T extends HTMLElement = HTMLInputElement>(options?: UseAutoFocusOptions): RefObject<T>;
/**
 * useAutoFocusFirst Hook
 *
 * Automatically focuses the first focusable element within a container.
 * Useful for forms with dynamic fields or complex layouts.
 *
 * **Usage:**
 * ```typescript
 * function MyForm() {
 *   const containerRef = useAutoFocusFirst<HTMLDivElement>();
 *
 *   return (
 *     <div ref={containerRef}>
 *       <input type="text" name="firstName" />
 *       <input type="text" name="lastName" />
 *       <button type="submit">Submit</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 */
export declare function useAutoFocusFirst<T extends HTMLElement = HTMLDivElement>(options?: Omit<UseAutoFocusOptions, 'selectOnFocus'>): RefObject<T>;
export default useAutoFocus;
//# sourceMappingURL=useAutoFocus.d.ts.map