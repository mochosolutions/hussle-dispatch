import { createEntityModule } from '@mocho/ui/redux';
import type { Document } from '../../types';

export const documentEntityModule = createEntityModule<Document>('documents');
export const documentActions = documentEntityModule.actions;
export const documentReducer = documentEntityModule.reducer;
export const documentSelectors = documentEntityModule.selectors;
