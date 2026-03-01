import { PayloadAction } from '@reduxjs/toolkit';
export interface ModalProps {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'warning' | 'error' | 'info' | 'success';
    open?: boolean;
    [key: string]: unknown;
}
export interface ModalState {
    isOpen: boolean;
    modalType: string | null;
    modalProps: ModalProps | null;
}
export interface UIState {
    modal: ModalState;
}
export interface OpenModalPayload {
    modalType: string;
    modalProps?: ModalProps;
}
declare const uiSlice: import('@reduxjs/toolkit').Slice<UIState, {
    openModal: (state: {
        modal: {
            isOpen: boolean;
            modalType: string | null;
            modalProps: {
                [x: string]: unknown;
                title?: string | undefined;
                message?: string | undefined;
                confirmLabel?: string | undefined;
                cancelLabel?: string | undefined;
                severity?: "warning" | "error" | "info" | "success" | undefined;
                open?: boolean | undefined;
            } | null;
        };
    }, action: PayloadAction<OpenModalPayload>) => void;
    closeModal: (state: {
        modal: {
            isOpen: boolean;
            modalType: string | null;
            modalProps: {
                [x: string]: unknown;
                title?: string | undefined;
                message?: string | undefined;
                confirmLabel?: string | undefined;
                cancelLabel?: string | undefined;
                severity?: "warning" | "error" | "info" | "success" | undefined;
                open?: boolean | undefined;
            } | null;
        };
    }) => void;
}, "ui", "ui", import('@reduxjs/toolkit').SliceSelectors<UIState>>;
export declare const openModal: import('@reduxjs/toolkit').ActionCreatorWithPayload<OpenModalPayload, "ui/openModal">, closeModal: import('@reduxjs/toolkit').ActionCreatorWithoutPayload<"ui/closeModal">;
export declare const uiReducer: import('redux').Reducer<UIState>;
export default uiSlice;
//# sourceMappingURL=ui.d.ts.map