import { NavItemType } from '../../../../../../types/menu';
interface Props {
    item: NavItemType;
    level: number;
    openItem: string[];
    onActiveItem: (itemIds: string[]) => void;
}
declare const NavItem: ({ item, level, openItem, onActiveItem }: Props) => import("@emotion/react/jsx-runtime").JSX.Element;
export default NavItem;
//# sourceMappingURL=NavItem.d.ts.map