/**
 * Navigation utility for saga-based navigation
 *
 * This provides a way to navigate programmatically from sagas.
 * The actual navigate function should be set by the consuming application.
 */

type NavigateFunction = (path: string, options?: { replace?: boolean }) => void;

let navigateRef: NavigateFunction | null = null;

/**
 * Set the navigate function (call this from your app's root component)
 * @param navigate - The navigate function from react-router
 */
export function setNavigate(navigate: NavigateFunction): void {
  navigateRef = navigate;
}

/**
 * Get the current navigate function
 * @returns The navigate function or a noop if not set
 */
export function getNavigate(): NavigateFunction {
  if (!navigateRef) {
    console.warn('Navigate function not set. Call setNavigate() in your app root.');
    return () => {};
  }
  return navigateRef;
}

/**
 * Clear the navigate function (useful for testing)
 */
export function clearNavigate(): void {
  navigateRef = null;
}

export default getNavigate;
