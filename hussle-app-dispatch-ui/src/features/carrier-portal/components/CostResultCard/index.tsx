import { useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Meta, BodyMuted } from 'components/Typography';
import {
  ASSUMED_MONTHLY_MILES,
  MIN_PROFIT_MARGIN,
  computeCostAnalysis,
} from './computeCostAnalysis';
import type { CostInputs } from './computeCostAnalysis';

export type { CostInputs };

export interface CostResultCardProps {
  inputs: CostInputs;
  /** Carrier's first name for the heading. If omitted, drops the personal address. */
  firstName?: string;
  onContinue: () => void;
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeDollarFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const DURATION_MS = 1500;
const MINIMUM_DELAY_MS = 300;

/** CostResultCard — PURE component. Accepts inputs as props; does NOT call useSelector. */
export const CostResultCard: React.FC<CostResultCardProps> = ({ inputs, firstName, onContinue }) => {
  const result = computeCostAnalysis(inputs);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [displayBreakEven, setDisplayBreakEven] = useState(
    prefersReducedMotion ? result.breakEvenRpm : 0,
  );
  const [displayMinimum, setDisplayMinimum] = useState(
    prefersReducedMotion ? result.minimumRatePerMile : 0,
  );
  const [tilesVisible, setTilesVisible] = useState(prefersReducedMotion);

  const rafBreakEven = useRef<number | undefined>(undefined);
  const rafMinimum = useRef<number | undefined>(undefined);
  const tilesTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    // Count-up break-even first
    const startTime = performance.now();
    const animateBreakEven = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION_MS, 1);
      setDisplayBreakEven(result.breakEvenRpm * easeOutCubic(t));
      if (t < 1) {
        rafBreakEven.current = requestAnimationFrame(animateBreakEven);
      }
    };
    rafBreakEven.current = requestAnimationFrame(animateBreakEven);

    // Count-up minimum rate 300ms after break-even starts
    const minimumStart = performance.now() + MINIMUM_DELAY_MS;
    const animateMinimum = (now: number) => {
      if (now < minimumStart) {
        rafMinimum.current = requestAnimationFrame(animateMinimum);
        return;
      }
      const elapsed = now - minimumStart;
      const t = Math.min(elapsed / DURATION_MS, 1);
      setDisplayMinimum(result.minimumRatePerMile * easeOutCubic(t));
      if (t < 1) {
        rafMinimum.current = requestAnimationFrame(animateMinimum);
      }
    };
    rafMinimum.current = requestAnimationFrame(animateMinimum);

    // Fade in expense tiles after both counts finish (~1800ms from mount)
    tilesTimeout.current = setTimeout(() => {
      setTilesVisible(true);
    }, MINIMUM_DELAY_MS + DURATION_MS + 100);

    return () => {
      if (rafBreakEven.current !== undefined) {
        cancelAnimationFrame(rafBreakEven.current);
      }
      if (rafMinimum.current !== undefined) {
        cancelAnimationFrame(rafMinimum.current);
      }
      if (tilesTimeout.current !== undefined) {
        clearTimeout(tilesTimeout.current);
      }
    };
  }, [prefersReducedMotion, result.breakEvenRpm, result.minimumRatePerMile]);

  const heading = firstName
    ? `Here's your real cost picture, ${firstName}.`
    : "Here's your real cost picture.";

  const disclaimer = `Based on ${ASSUMED_MONTHLY_MILES.toLocaleString()} miles/month and a ${(MIN_PROFIT_MARGIN * 100).toFixed(0)}% profit margin.`;

  return (
    <Box
      sx={{
        bgcolor: '#0F172A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 3, md: 4 },
        pt: 6,
        pb: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 700 }}>
        {/* Overline */}
        <Meta
          sx={{
            color: 'grey.400',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            mb: 1,
          }}
        >
          COST ANALYSIS COMPLETE
        </Meta>

        {/* Heading */}
        <Typography
          sx={{
            fontSize: { xs: 24, md: 30 },
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'common.white',
            mb: 1,
          }}
        >
          {heading}
        </Typography>

        {/* Subtext */}
        <BodyMuted
          sx={{
            color: 'grey.300',
            mb: 4,
          }}
        >
          Based on your expenses, here&apos;s what every mile needs to earn to keep your business
          profitable.
        </BodyMuted>

        {/* Break-even card */}
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 3,
            mb: 2,
          }}
        >
          <Meta sx={{ color: 'grey.400', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>
            YOUR BREAK-EVEN RATE PER MILE
          </Meta>
          <Typography
            sx={{
              fontSize: { xs: 36, md: 48 },
              fontWeight: 700,
              lineHeight: 1,
              color: 'common.white',
              mb: 1,
            }}
          >
            {currencyFmt.format(displayBreakEven)}
          </Typography>
          <BodyMuted sx={{ color: 'grey.300', fontSize: 14 }}>
            Every mile you drive costs this much just to cover your costs &amp; business expenses.
          </BodyMuted>
        </Box>

        {/* Minimum rate card */}
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 2,
            p: 3,
            mb: 4,
          }}
        >
          <Meta sx={{ color: 'grey.400', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>
            MINIMUM RATE TO BOOK A LOAD
          </Meta>
          <Typography
            sx={{
              fontSize: { xs: 44, md: 60 },
              fontWeight: 700,
              lineHeight: 1,
              color: 'success.light',
              mb: 1,
            }}
          >
            {currencyFmt.format(displayMinimum)}
          </Typography>
          <BodyMuted sx={{ color: 'grey.300', fontSize: 14 }}>
            Load Intelligence will reject anything below this rate — protecting your bottom line.
          </BodyMuted>
        </Box>

        {/* Expense breakdown tiles */}
        <Box
          sx={{
            opacity: tilesVisible ? 1 : 0,
            transition: prefersReducedMotion ? 'none' : 'opacity 400ms ease-out',
            mb: 4,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Meta
                  sx={{ color: 'grey.400', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}
                >
                  Monthly Fixed
                </Meta>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'common.white' }}>
                  {wholeDollarFmt.format(result.monthlyFixed)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Meta
                  sx={{ color: 'grey.400', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}
                >
                  Monthly Variable
                </Meta>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'common.white' }}>
                  {wholeDollarFmt.format(result.monthlyVariable)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Meta
                  sx={{ color: 'grey.400', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}
                >
                  Fuel Cost/Mile
                </Meta>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'common.white' }}>
                  {currencyFmt.format(result.fuelCostPerMile)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Disclaimer */}
        <Stack direction="row" justifyContent={{ xs: 'center', md: 'flex-start' }}>
          <BodyMuted
            sx={{ color: 'grey.400', fontSize: 12, maxWidth: 600, textAlign: 'center', mb: 4 }}
          >
            {disclaimer}
          </BodyMuted>
        </Stack>

        {/* CTA */}
        <Stack direction="row" justifyContent={{ xs: 'center', md: 'flex-start' }}>
          <Button
            variant="contained"
            color="success"
            onClick={onContinue}
            fullWidth
            sx={{
              maxWidth: { md: 280 },
              mt: 2,
              minHeight: 48,
              fontWeight: 600,
            }}
          >
            This looks right — Continue →
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
