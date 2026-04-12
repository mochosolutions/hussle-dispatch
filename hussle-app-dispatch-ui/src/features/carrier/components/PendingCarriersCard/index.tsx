import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getPendingCarriers } from 'utils/api/dashboard/dashboardApi';
import type { PendingCarrier } from 'utils/api/dashboard/dashboardApi';

export const PendingCarriersCard: React.FC = () => {
  const navigate = useNavigate();
  const [carriers, setCarriers] = useState<PendingCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPendingCarriers();
      setCarriers(result.data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load pending carriers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (carrierId: string) => {
    navigate(`/carriers/${carrierId}?tab=onboarding`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Stack spacing={1.5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      );
    }

    if (error) {
      return (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      );
    }

    if (carriers.length === 0) {
      return (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No carriers pending review
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={1}>
        {carriers.map((carrier) => (
          <Box
            key={carrier.id}
            onClick={() => handleRowClick(carrier.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {carrier.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {carrier.type.replace(/_/g, ' ')}
                </Typography>
                {carrier.completedAt && (
                  <Typography variant="caption" color="text.disabled">
                    Completed {new Date(carrier.completedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={0.5}>
              {carrier.driverCount > 0 && (
                <Chip
                  label={`${carrier.driverCount} driver${carrier.driverCount !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              )}
              {carrier.vehicleCount > 0 && (
                <Chip
                  label={`${carrier.vehicleCount} vehicle${carrier.vehicleCount !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Pending Carriers
            </Typography>
            {!loading && carriers.length > 0 && (
              <Badge badgeContent={carriers.length} color="warning" />
            )}
          </Stack>
        }
      />
      <CardContent sx={{ pt: 0 }}>{renderContent()}</CardContent>
    </Card>
  );
};
