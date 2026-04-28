import type { NavItemType } from '@mocho/ui/types';
import {
  House,
  Van,
  Truck,
  FileText,
  Contact,
  MapPinCheckIcon,
  Users,
  Settings,
  Calculator,
} from 'lucide-react';

export const menuItems: NavItemType[] = [
  {
    id: 'navigation',
    title: '',
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/',
        icon: <House size={24} />,
      },
      {
        id: 'dispatch-board',
        title: 'Dispatch Board',
        type: 'item',
        url: '/loads',
        icon: <Truck size={24} />,
      },
      {
        id: 'fleet',
        title: 'Fleet Management',
        type: 'collapse',
        icon: <Van size={24} />,
        children: [
          { id: 'carriers', title: 'Carriers', type: 'item', url: '/carriers' },
          { id: 'vehicles', title: 'Vehicles', type: 'item', url: '/vehicles' },
          { id: 'drivers', title: 'Drivers', type: 'item', url: '/drivers' },
        ],
      },
      {
        id: 'contacts',
        title: 'Contacts',
        type: 'item',
        url: '/contacts',
        icon: <Contact size={24} />,
      },
      {
        id: 'customers',
        title: 'Customers',
        type: 'item',
        url: '/customers',
        icon: <Users size={24} />,
      },
      {
        id: 'places',
        title: 'Places',
        type: 'item',
        url: '/places',
        icon: <MapPinCheckIcon size={24} />,
      },
      // {
      //   id: 'invoices',
      //   title: 'Invoices',
      //   type: 'item',
      //   url: '/invoices',
      //   icon: <FileText size={24} />,
      // },
      // {
      //   id: 'accounting',
      //   title: 'Accounting',
      //   type: 'collapse',
      //   icon: <Calculator size={24} />,
      //   children: [
      //     { id: 'settlements', title: 'Settlements', type: 'item', url: '/accounting/settlements' },
      //     { id: 'ifta', title: 'IFTA', type: 'item', url: '/accounting/ifta' },
      //     { id: 'expenses', title: 'Expenses', type: 'item', url: '/accounting/expenses' },
      //   ],
      // },
      {
        id: 'settings',
        title: 'Settings',
        type: 'item',
        url: '/settings',
        icon: <Settings size={24} />,
      },
    ],
  },
];
