/**
 * Menu action creators for layout components
 *
 * These work with the LayoutContext dispatch system
 */

/**
 * Action to open/close the drawer
 */
export function openDrawer(open: boolean) {
  return { type: 'menu/openDrawer' as const, payload: open };
}

/**
 * Action to set active menu group ID
 */
export function activeID(id: string | null) {
  return { type: 'menu/activeID' as const, payload: id };
}

/**
 * Action to set active menu items
 */
export function activeItem(items: string[]) {
  return { type: 'menu/activeItem' as const, payload: items };
}

// Export action types for type inference
export type MenuAction =
  | ReturnType<typeof openDrawer>
  | ReturnType<typeof activeID>
  | ReturnType<typeof activeItem>;
