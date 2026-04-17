import { createEntityModule } from '@mocho/ui/redux';
import type { Member } from 'utils/api/team/teamApi';

export const teamEntityModule = createEntityModule<Member>('teamMembers');
export const teamEntityActions = teamEntityModule.actions;
export const teamEntityReducer = teamEntityModule.reducer;
export const teamEntitySelectors = teamEntityModule.selectors;
