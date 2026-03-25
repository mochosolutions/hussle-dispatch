import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import { useSelector, useDispatch } from 'store';
import MainCard from 'components/MainCard';
import UpgradePlanDialog from 'components/UpgradePlanDialog';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import { fetchTeamRequest } from '../../store/reducers/teamSlice';
import MemberTable from '../MemberTable';
import { InvitationTable } from '../InvitationTable';
import { InviteMemberDialog } from '../InviteMemberDialog';
import type { RootState } from 'store';

const TeamTab = () => {
  const dispatch = useDispatch();
  const organizationId = useSelector(organizationIdSelector);
  const teamState = useSelector((state: RootState) => state.pages.team);
  const members = teamState?.members ?? [];
  const invitations = teamState?.invitations ?? [];
  const usage = teamState?.usage ?? null;
  const loading = teamState?.loading ?? {};
  const isLoading = loading.fetchTeam === 'Pending';

  const [inviteOpen, setInviteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTeamRequest());
  }, [dispatch]);

  const handleInviteClick = () => {
    if (usage && usage.users.current >= usage.users.limit) {
      setUpgradeOpen(true);
    } else {
      setInviteOpen(true);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Team Members
          </Typography>
          {usage && (
            <Typography variant="body2" color="text.secondary">
              {usage.users.current} of {usage.users.limit} seats used
            </Typography>
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

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organizationId={organizationId ?? ''}
      />

      <UpgradePlanDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        resourceType="team members"
        limit={usage?.users.limit ?? 3}
      />
    </Box>
  );
};

export default TeamTab;
