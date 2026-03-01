/**
 * StateInspector component for visualizing Redux state in Storybook
 *
 * Displays formatted JSON state with optional path highlighting.
 */
export interface StateInspectorProps {
    /** Title displayed above the state viewer */
    title: string;
    /** The state object to display */
    state: unknown;
    /** Optional path to highlight (e.g., "loading.getAll") */
    highlightPath?: string;
    /** Maximum height of the scrollable area (default: 400) */
    maxHeight?: number;
}
/**
 * Component for displaying Redux state as formatted JSON
 *
 * @example
 * ```tsx
 * <StateInspector
 *   title="Page State"
 *   state={{ loading: { getAll: 'Pending' }, errors: {} }}
 *   highlightPath="loading.getAll"
 * />
 * ```
 */
export declare function StateInspector({ title, state, highlightPath, maxHeight, }: StateInspectorProps): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=StateInspector.d.ts.map