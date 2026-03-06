import { useEffect, useRef, RefObject } from 'react';

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
export function useAutoFocus<T extends HTMLElement = HTMLInputElement>(
  options: UseAutoFocusOptions = {}
): RefObject<T> {
  const {
    enabled = true,
    delay = 100,
    selectOnFocus = false,
    checkVisibility = true,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const element = ref.current;

    const focusElement = () => {
      // Check if element is visible (avoid focusing hidden elements)
      if (checkVisibility) {
        const isVisible =
          element.offsetWidth > 0 &&
          element.offsetHeight > 0 &&
          window.getComputedStyle(element).visibility !== 'hidden';

        if (!isVisible) {
          console.warn('useAutoFocus: Element is not visible, skipping focus');
          return;
        }
      }

      // Focus element
      element.focus();

      // Select text if requested and element supports selection
      if (selectOnFocus && 'select' in element && typeof element.select === 'function') {
        try {
          (element as unknown as HTMLInputElement | HTMLTextAreaElement).select();
        } catch (error) {
          // Silently fail if selection not supported
          console.debug('useAutoFocus: Text selection failed', error);
        }
      }
    };

    // Delay focus to avoid conflicts with animations/transitions
    const timeoutId = setTimeout(focusElement, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, delay, selectOnFocus, checkVisibility]);

  return ref;
}

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
export function useAutoFocusFirst<T extends HTMLElement = HTMLDivElement>(
  options: Omit<UseAutoFocusOptions, 'selectOnFocus'> = {}
): RefObject<T> {
  const { enabled = true, delay = 100, checkVisibility = true } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const container = ref.current;

    const focusFirstElement = () => {
      // Find first focusable element
      const focusableSelectors = [
        'input:not([disabled]):not([type="hidden"])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'button:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const firstFocusable = container.querySelector<HTMLElement>(focusableSelectors);

      if (!firstFocusable) {
        console.warn('useAutoFocusFirst: No focusable element found in container');
        return;
      }

      // Check visibility
      if (checkVisibility) {
        const isVisible =
          firstFocusable.offsetWidth > 0 &&
          firstFocusable.offsetHeight > 0 &&
          window.getComputedStyle(firstFocusable).visibility !== 'hidden';

        if (!isVisible) {
          console.warn('useAutoFocusFirst: First focusable element is not visible');
          return;
        }
      }

      // Focus element
      firstFocusable.focus();
    };

    // Delay focus to avoid conflicts
    const timeoutId = setTimeout(focusFirstElement, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, delay, checkVisibility]);

  return ref;
}

export default useAutoFocus;
