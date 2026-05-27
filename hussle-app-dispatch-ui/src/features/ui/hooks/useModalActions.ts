import { useMemo } from 'react';
import { useDispatch } from 'store';
import { openModal, closeModal } from '../store/reducers/uiSlice';
import type { ModalType, ModalTypeMap } from '../types/popupTypes';

export const useModalActions = () => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      openModal: <T extends ModalType>(
        modalType: T,
        modalProps: ModalTypeMap[T],
      ) => dispatch(openModal({ modalType, modalProps })),
      closeModal: () => dispatch(closeModal()),
    }),
    [dispatch],
  );
};
