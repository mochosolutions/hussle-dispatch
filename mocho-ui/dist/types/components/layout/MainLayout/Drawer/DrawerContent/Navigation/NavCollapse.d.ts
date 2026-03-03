import { default as React } from 'react';
import { NavItemType } from '../../../../../../types/menu';
interface Props {
    menu: NavItemType;
    level: number;
    parentId: string;
    setSelectedItems: React.Dispatch<React.SetStateAction<string | undefined>>;
    selectedItems: string | undefined;
    setSelectedLevel: React.Dispatch<React.SetStateAction<number>>;
    selectedLevel: number;
    openItem: string[];
    onActiveItem: (itemIds: string[]) => void;
}
declare const NavCollapse: ({ menu, level, parentId, setSelectedItems, selectedItems, setSelectedLevel, selectedLevel, openItem, onActiveItem, }: Props) => import("@emotion/react/jsx-runtime").JSX.Element;
export default NavCollapse;
//# sourceMappingURL=NavCollapse.d.ts.map