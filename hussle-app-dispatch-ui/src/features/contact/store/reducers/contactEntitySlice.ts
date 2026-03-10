import { createEntityModule } from '@mocho/ui/redux';
import type { Contact } from '../../types';

export const contactEntityModule = createEntityModule<Contact>('contacts');
export const contactActions = contactEntityModule.actions;
export const contactReducer = contactEntityModule.reducer;
export const contactSelectors = contactEntityModule.selectors;
