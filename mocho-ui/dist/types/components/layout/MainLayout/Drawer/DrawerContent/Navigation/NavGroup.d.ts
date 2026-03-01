import { NavItemType } from '../../../../../../types/menu';
interface Props {
    item: NavItemType;
    lastItem: number;
    remItems: NavItemType[];
    lastItemId: string;
    setSelectedItems: React.Dispatch<React.SetStateAction<string | undefined>>;
    selectedItems: string | undefined;
    setSelectedLevel: React.Dispatch<React.SetStateAction<number>>;
    selectedLevel: number;
}
declare const NavGroup: ({ item, lastItem, remItems, lastItemId, setSelectedItems, selectedItems, setSelectedLevel, selectedLevel, }: Props) => import("@emotion/react/jsx-runtime").JSX.Element;
export default NavGroup;
//# sourceMappingURL=NavGroup.d.ts.map