import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import MainCard from 'components/MainCard';
import { SectionTitle, BodyMuted } from 'components/Typography';
import { fetchTeamRequest } from '../../store/reducers/teamSlice';
import MemberTable from '../MemberTable';
import { InvitationTable } from '../InvitationTable';
import type { RootState } from 'store';

const TeamTab = () => {
  const dispatch = useDispatch();
  const teamState = useSelector((state: RootState) => state.pages.team);
  const members = teamState?.members ?? [];
  const invitations = teamState?.invitations ?? [];
  const usage = teamState?.usage ?? null;
  const loading = teamState?.loading ?? {};
  const isLoading = loading.fetchTeam === 'Pending';

  useEffect(() => {
    dispatch(fetchTeamRequest());
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
      <Box>
        <SectionTitle>Team Members</SectionTitle>
        {usage && (
          <BodyMuted>
            {usage.users.current} of {usage.users.limit} seats used
          </BodyMuted>
        )}
      </Box>

      <MainCard content={false}>
        <MemberTable members={members} loading={isLoading} organizationId="" />
      </MainCard>

      {invitations.length > 0 && (
        <MainCard title="Pending Invitations" content={false}>
          <InvitationTable invitations={invitations} />
        </MainCard>
      )}
    </Box>
  );
};

export default TeamTab;
