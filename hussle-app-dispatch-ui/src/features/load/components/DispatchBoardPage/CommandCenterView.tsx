import { useEffect, useState, useCallback } from 'react';
import { Box, Button, Chip, Stack } from '@mui/material';

import { Meta } from 'components/Typography';
import { useSelector, useDispatch } from 'store';
import { useNavigate } from 'react-router-dom';
import type { RootState } from 'store';

import {
  ingestDatRequest,
  setSourceFilter,
  startPolling,
  stopPolling,
} from '../../store/reducers/loadPageSlice';
import type { LoadBoardSource } from '../../types';
import {
  selectFilteredLoads,
  selectCommandCenterLayers,
} from '../../store/selectors/loadSelectors';
import { selectAllDrivers } from 'features/driver/store/selectors/driverSelectors';

import { CommandCenterMap } from './CommandCenterMap';
import { CommandCenterPanel } from './CommandCenterPanel';
import { CommandCenterTicker } from './CommandCenterTicker';
import type { PanelMode } from './CommandCenterPanel';

const SOURCE_OPTIONS = ['all', 'relay', 'dat'] as const;

const SOURCE_CHIP_COLOR: Record<string, 'default' | 'primary' | 'warning'> = {
  all: 'default',
  relay: 'primary',
  dat: 'warning',
};

export const CommandCenterView: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Load board feed data (consolidated into load page slice)
  const loadPage = useSelector((state: RootState) => state.pages.loads);
  const feedLoads = loadPage.feedLoads;
  const drivers = useSelector(selectAllDrivers);
  const sourceFilter = loadPage.sourceFilter;
  const datIngesting = loadPage.datIngesting;
  const meta = loadPage.feedMeta;

  // Dispatch board data (own feature)
  const activeLoads = useSelector(selectFilteredLoads);
  const layers = useSelector(selectCommandCenterLayers);

  // Panel state
  const [panelMode, setPanelMode] = useState<PanelMode>('roster');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  // Start loadboard polling on mount
  useEffect(() => {
    dispatch(startPolling());
    return () => {
      dispatch(stopPolling());
    };
  }, [dispatch]);

  const handleDriverClick = useCallback((id: string) => {
    setSelectedDriverId(id);
    setSelectedLoadId(null);
    setPanelMode('driver-detail');
  }, []);

  const handleLoadClick = useCallback((id: string) => {
    setSelectedLoadId(id);
    setSelectedDriverId(null);
    setPanelMode('load-detail');
  }, []);

  const handleBack = useCallback(() => {
    setPanelMode('roster');
    setSelectedDriverId(null);
    setSelectedLoadId(null);
  }, []);

  const handleActiveLoadClick = useCallback(
    (id: string) => {
      navigate(`/loads/${id}`);
    },
    [navigate],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1 }}>
        {SOURCE_OPTIONS.map((src) => (
          <Chip
            key={src}
            label={src === 'all' ? 'All' : `${src.charAt(0).toUpperCase()}${src.slice(1)}`}
            variant={sourceFilter === src ? 'filled' : 'outlined'}
            color={SOURCE_CHIP_COLOR[src] ?? 'default'}
            onClick={() => dispatch(setSourceFilter(src as 'all' | LoadBoardSource))}
            size="small"
          />
        ))}
        <Button
          variant="outlined"
          size="small"
          onClick={() => dispatch(ingestDatRequest())}
          disabled={datIngesting}
        >
          {datIngesting ? 'Syncing...' : 'Sync DAT'}
        </Button>
        {meta && (
          <Meta sx={{ ml: 1 }}>
            {meta.total} loads
          </Meta>
        )}
      </Stack>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CommandCenterMap
            feedLoads={feedLoads}
            drivers={drivers}
            activeLoads={activeLoads}
            layers={layers}
            sourceFilter={sourceFilter}
            selectedDriverId={selectedDriverId}
            selectedLoadId={selectedLoadId}
            onDriverClick={handleDriverClick}
            onLoadClick={handleLoadClick}
            onActiveLoadClick={handleActiveLoadClick}
          />
        </Box>
        <CommandCenterPanel
          mode={panelMode}
          drivers={drivers}
          feedLoads={feedLoads}
          selectedDriverId={selectedDriverId}
          selectedLoadId={selectedLoadId}
          onSelectDriver={handleDriverClick}
          onSelectLoad={handleLoadClick}
          onBack={handleBack}
        />
      </Box>

      <CommandCenterTicker activeLoads={activeLoads} />
    </Box>
  );
};
