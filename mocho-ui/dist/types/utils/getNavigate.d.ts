/**
 * Navigation utility for saga-based navigation
 *
 * This provides a way to navigate programmatically from sagas.
 * The actual navigate function should be set by the consuming application.
 */
type NavigateFunction = (path: string, options?: {
    replace?: boolean;
}) => void;
/**
 * Set the navigate function (call this from your app's root component)
 * @param navigate - The navigate function from react-router
 */
export declare function setNavigate(navigate: NavigateFunction): void;
/**
 * Get the current navigate function
 * @returns The navigate function or a noop if not set
 */
export declare function getNavigate(): NavigateFunction;
/**
 * Clear the navigate function (useful for testing)
 */
export declare function clearNavigate(): void;
export default getNavigate;
//# sourceMappingURL=getNavigate.d.ts.map