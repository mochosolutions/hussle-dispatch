/**
 * Utility functions for DynamicForm
 * Handles nested field access using dot notation (e.g., 'socialLinks.twitter')
 */
/**
 * Get nested value from object using dot notation
 * Supports deep nesting: 'user.address.city'
 *
 * @example
 * const obj = { user: { name: 'John', address: { city: 'NYC' } } };
 * getFieldValue(obj, 'user.address.city'); // 'NYC'
 * getFieldValue(obj, 'user.name'); // 'John'
 * getFieldValue(obj, 'missing.path'); // undefined
 *
 * @param obj - Source object
 * @param path - Dot-notation path to value
 * @returns Value at path, or undefined if not found
 */
export declare function getFieldValue<T>(obj: T, path: string): any;
/**
 * Set nested value in object using dot notation
 * Creates intermediate objects as needed
 *
 * @example
 * const obj = { user: { name: 'John' } };
 * setNestedFieldValue(obj, 'user.address.city', 'NYC');
 * // Result: { user: { name: 'John', address: { city: 'NYC' } } }
 *
 * @param obj - Target object
 * @param path - Dot-notation path to value
 * @param value - Value to set
 * @returns Modified object (mutates original)
 */
export declare function setNestedFieldValue<T>(obj: T, path: string, value: any): T;
/**
 * Check if a field path exists in an object
 * Useful for conditional rendering based on field availability
 *
 * @param obj - Source object
 * @param path - Dot-notation path to check
 * @returns True if path exists, false otherwise
 */
export declare function hasFieldPath<T>(obj: T, path: string): boolean;
/**
 * Get the default grid breakpoints for a field
 * Falls back to xs=12, md=6 if not specified
 *
 * @param grid - Optional grid breakpoints from field config
 * @returns Grid breakpoints object for Material-UI Grid
 */
export declare function getGridBreakpoints(grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
}): {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
};
//# sourceMappingURL=utils.d.ts.map