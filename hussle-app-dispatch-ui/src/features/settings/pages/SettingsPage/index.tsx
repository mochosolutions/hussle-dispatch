import { useMemo, useState } from 'react';
import { Box, Button } from '@mui/material';

import { useSelector } from 'store';
import { PageWrapper } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { DetailTabBar } from 'components/DetailTabBar';
import {
  isAdminSelector,
  organizationIdSelector,
} from 'features/auth/store/selectors/authSelector';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import GeneralTab from '../../components/SettingsPage/GeneralTab';
import TeamTab from '../../components/TeamTab';
import { selectSubscriptionUsage } from '../../store/selectors/settingsSelectors';

const SETTINGS_TABS = [
  { value: 'general', label: 'General' },
  { value: 'team', label: 'Team' },
] as const;

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const isAdmin = useSelector(isAdminSelector);
  const organizationId = useSelector(organizationIdSelector);
  const usage = useSelector(selectSubscriptionUsage);
  const { openModal } = useModalActions();

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => tab.value !== 'team' || isAdmin),
    [isAdmin],
  );

  const handleInviteClick = () => {
    if (usage && usage.users.current >= usage.users.limit) {
      openModal('upgradePlan', { resourceType: 'team members', limit: usage.users.limit });
      return;
    }
    openModal('inviteMember', { organizationId: organizationId ?? '' });
  };

  const primaryAction =
    activeTab === 'team' ? (
      <Button variant="contained" color="primary" onClick={handleInviteClick}>
        Invite Member
      </Button>
    ) : undefined;

  return (
    <PageWrapper errorContext="SettingsPage">
      <ListLayout title="Settings" primaryAction={primaryAction}>
        <DetailTabBar tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'team' && isAdmin && <TeamTab />}
        </Box>
      </ListLayout>
    </PageWrapper>
  );
};

export default SettingsPage;
