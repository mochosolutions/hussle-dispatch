import { useEffect } from 'react';
import { Box, Button } from '@mui/material';

import { useSelector, useDispatch } from 'store';
import MainCard from 'components/MainCard';
import { SectionTitle, BodyMuted } from 'components/Typography';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { fetchTeamRequest } from '../../store/reducers/teamSlice';
import MemberTable from '../MemberTable';
import { InvitationTable } from '../InvitationTable';
import type { RootState } from 'store';

const TeamTab = () => {
  const dispatch = useDispatch();
  const { openModal } = useModalActions();
  const organizationId = useSelector(organizationIdSelector);
  const teamState = useSelector((state: RootState) => state.pages.team);
  const members = teamState?.members ?? [];
  const invitations = teamState?.invitations ?? [];
  const usage = teamState?.usage ?? null;
  const loading = teamState?.loading ?? {};
  const isLoading = loading.fetchTeam === 'Pending';

  useEffect(() => {
    dispatch(fetchTeamRequest());
  }, [dispatch]);

  const handleInviteClick = () => {
    if (usage && usage.users.current >= usage.users.limit) {
      openModal('upgradePlan', {
        resourceType: 'team members',
        limit: usage.users.limit,
      });
    } else {
      openModal('inviteMember', { organizationId: organizationId ?? '' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <SectionTitle>Team Members</SectionTitle>
          {usage && (
            <BodyMuted>
              {usage.users.current} of {usage.users.limit} seats used
            </BodyMuted>
          )}
        </Box>
        <Button variant="contained" color="primary" onClick={handleInviteClick}>
          Invite Member
        </Button>
      </Box>

      <MainCard>
        <MemberTable members={members} loading={isLoading} organizationId={organizationId ?? ''} />
      </MainCard>

      {invitations.length > 0 && (
        <MainCard title="Pending Invitations">
          <InvitationTable invitations={invitations} />
        </MainCard>
      )}
    </Box>
  );
};

export default TeamTab;
