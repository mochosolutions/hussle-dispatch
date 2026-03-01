import dashboard from './dashboard';
// import contractMenuItems from 'pages/contracts/menu-items';
// import dealsMenuItems from 'pages/deals/menu-items';

// types
import {NavItemType} from '../../../types/menu';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: {items: NavItemType[]} = {
  items: [
    dashboard,
    // contractMenuItems,
    // dealsMenuItems
  ],
};

export default menuItems;
