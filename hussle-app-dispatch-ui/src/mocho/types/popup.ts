import type { ElementType } from 'react';

export interface DrawerState {
  drawerType: string;
  drawerProps: Record<string, unknown>;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  width?: number;
  disableBackdropClose?: boolean;
}

export interface ModalState {
  modalType: string;
  modalProps: Record<string, unknown>;
}

/**
 * Registry mapping popup type keys to their React components.
 *
 * DrawerManager / ModalManager spread `Record<string, unknown>` props into these
 * components at runtime. Due to contravariance in function parameter types,
 * `ComponentType<SpecificProps>` is not directly assignable to
 * `ComponentType<Record<string, unknown>>`.
 *
 * We use `React.ElementType` which accepts any valid React component
 * (function, class, or string tag) without enforcing specific props at the
 * registry level. Prop correctness is ensured by the dispatch call-sites
 * (e.g. `openDrawer('carrierCompanyInfo', { carrierId })`) rather than here.
 */
export type PopupComponentMap = Record<string, ElementType>;
