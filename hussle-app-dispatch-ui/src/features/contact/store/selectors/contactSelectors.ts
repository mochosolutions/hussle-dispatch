import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { contactSelectors } from '../reducers/contactEntitySlice';
import formatPhone from 'utils/formatPhone';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');

export const selectAllContacts = (state: RootState) => contactSelectors.selectAll(state);

export const selectContactById = (id: string) => (state: RootState) =>
  contactSelectors.selectById(state, id);

export const selectContactListLoading = (state: RootState) => {
  const status = state.pages.contacts.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectContactCreateLoading = (state: RootState) =>
  state.pages.contacts.loading['create'] === LoadingState.Pending;

export const selectContactUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.contacts.loading[`update:${id}`] === LoadingState.Pending;

export const selectContactDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.contacts.loading[`delete:${id}`] === LoadingState.Pending;

export const selectContactDetailLoading = (id: string) => (state: RootState) =>
  state.pages.contacts.loading[`getById:${id}`] === LoadingState.Pending;

export const selectFormattedContacts = createSelector(
  [selectAllContacts],
  (contacts) => contacts.map((c) => ({ ...c, phone: formatPhone(c.phone) })),
);

export const selectFormattedContactById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? contactSelectors.selectById(state, id) : undefined)],
    (contact) => {
      if (!contact) {
        return undefined;
      }
      return {
        ...contact,
        phone: formatPhone(contact.phone),
        createdAt: formatDate(contact.createdAt),
        updatedAt: formatDate(contact.updatedAt),
      };
    },
  );
