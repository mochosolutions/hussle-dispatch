/**
 * Menu action creators for layout components
 *
 * These work with the LayoutContext dispatch system
 */
/**
 * Action to open/close the drawer
 */
export declare function openDrawer(open: boolean): {
    type: "menu/openDrawer";
    payload: boolean;
};
/**
 * Action to set active menu group ID
 */
export declare function activeID(id: string | null): {
    type: "menu/activeID";
    payload: string | null;
};
/**
 * Action to set active menu items
 */
export declare function activeItem(items: string[]): {
    type: "menu/activeItem";
    payload: string[];
};
export type MenuAction = ReturnType<typeof openDrawer> | ReturnType<typeof activeID> | ReturnType<typeof activeItem>;
//# sourceMappingURL=menu.d.ts.map