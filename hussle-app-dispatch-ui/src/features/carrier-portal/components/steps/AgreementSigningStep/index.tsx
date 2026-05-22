// ---------------------------------------------------------------------------
// AgreementSigningStep — renders the dispatch agreement signing experience.
//
// Behavior:
//   1. On mount, dispatches `fetchAgreement({ templateKey: 'DISPATCH_AGREEMENT' })`.
//      The saga calls `GET /carrier-portal/agreements?templateKey=...` which
//      lazily creates the DocuSeal envelope (safety net in
//      `ensureAgreementForCarrier`) if one doesn't exist.
//   2. Branches on the resolved `AgreementContext`:
//        - null           → "Contact dispatcher" Callout (only reachable if
//                            ensure-create failed; surfaces the error).
//        - PENDING        → plain `<iframe>` to DocuSeal signing page proxied
//                            via `/docuseal-embed/*` (Vite strips XFO).
//        - SIGNED         → auto-advance via submitStep.
//        - VOIDED/DECLINED/EXPIRED → "Agreement no longer valid" Callout.
//   3. While PENDING, polls the agreement endpoint every 4s so the moment the
//      DocuSeal webhook flips status to SIGNED, the step advances on its own.
//      The plain iframe gives us no `onComplete` callback, so polling is the
//      only signal we have. Polling stops as soon as a non-PENDING status
//      arrives.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { PageTitle, BodyMuted } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import Callout from 'features/carrier-portal/components/Callout';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectAgreement,
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface AgreementSigningStepProps {
  step: Step;
}

const TEMPLATE_KEY = 'DISPATCH_AGREEMENT';

/**
 * The backend returns DocuSeal's signing URL (e.g.
 * `http://localhost:3030/s/SLUG`). DocuSeal sends `x-frame-options: SAMEORIGIN`
 * which blocks iframing from the carrier-portal origin, so we route the iframe
 * through the same-origin Vite dev proxy at `/docuseal-embed/*` (vite.config.ts)
 * which strips the frame-blocking headers. In prod the same path should be
 * proxied at the edge (nginx config).
 */
const toEmbedUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    return `/docuseal-embed${url.pathname}${url.search}`;
  } catch {
    return raw;
  }
};

const AgreementSigningStep: React.FC<AgreementSigningStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const agreement = useSelector(selectAgreement);
  const fetchStatus = useSelector(selectLoading('agreement'));

  const fetchDispatched = useRef(false);
  const advanceDispatched = useRef(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Fire fetchAgreement once on mount.
  useEffect(() => {
    if (fetchDispatched.current) {
      return;
    }
    fetchDispatched.current = true;
    dispatch(carrierPortalV2Actions.fetchAgreement({ templateKey: TEMPLATE_KEY }));
  }, [dispatch]);

  // Auto-advance once when SIGNED is observed.
  useEffect(() => {
    if (advanceDispatched.current) {
      return;
    }
    if (agreement?.status === 'SIGNED') {
      advanceDispatched.current = true;
      dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: step.id,
          answers: { acknowledged: true },
        }),
      );
    }
  }, [agreement?.status, dispatch, step.id]);

  // While PENDING, poll the agreement endpoint so the page detects when the
  // DocuSeal webhook flips the status to SIGNED (the plain iframe gives no
  // explicit completion callback). Stops as soon as we see anything other
  // than PENDING.
  useEffect(() => {
    if (agreement?.status !== 'PENDING') {
      return undefined;
    }
    const handle = window.setInterval(() => {
      dispatch(carrierPortalV2Actions.fetchAgreement({ templateKey: TEMPLATE_KEY }));
    }, 4000);
    return () => window.clearInterval(handle);
  }, [agreement?.status, dispatch]);

  if (!session) {
    return null;
  }

  const header = (
    <>
      {step.title ? <PageTitle sx={{ mb: 1 }}>{step.title}</PageTitle> : null}
      {step.subtitle ? <BodyMuted sx={{ mb: 3 }}>{step.subtitle}</BodyMuted> : null}
    </>
  );

  // SIGNED — no embed; useEffect above dispatches advance.
  if (agreement?.status === 'SIGNED') {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="green">Agreement signed. Continuing…</Callout>
      </Box>
    );
  }

  // VOIDED / DECLINED / EXPIRED — terminal failure states.
  if (
    agreement?.status === 'VOIDED' ||
    agreement?.status === 'DECLINED' ||
    agreement?.status === 'EXPIRED'
  ) {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="red">
          This agreement is no longer valid. Contact your dispatcher to resend.
        </Callout>
      </Box>
    );
  }

  // PENDING (or DRAFT) with embedUrl — render the embed.
  if (agreement?.status === 'PENDING' && agreement.embedUrl) {
    if (iframeFailed) {
      return (
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          {header}
          <Callout variant="red">
            The signing page failed to load. Check your connection and refresh
            this page, or contact your dispatcher if the problem persists.
          </Callout>
        </Box>
      );
    }
    const embedSrc = toEmbedUrl(agreement.embedUrl);
    return (
      <Box sx={{ width: '100%', maxWidth: 760 }}>
        {header}
        <Box
          component="iframe"
          src={embedSrc}
          title="Dispatch agreement"
          onError={() => setIframeFailed(true)}
          sx={{
            width: '100%',
            height: { xs: 'calc(100vh - 280px)', md: 720 },
            minHeight: 480,
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1,
            backgroundColor: 'background.paper',
          }}
        />
        <BodyMuted sx={{ mt: 1.5, fontSize: 12 }}>
          The page above is the official dispatch agreement. Sign at the bottom
          to continue.
        </BodyMuted>
      </Box>
    );
  }

  // No agreement yet — GAP: portal cannot self-create. Wait for dispatcher.
  if (agreement === null && fetchStatus === 'success') {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="amber">
          Your dispatcher hasn&apos;t sent the agreement yet. Contact them to
          send it.
        </Callout>
      </Box>
    );
  }

  // Loading / pending fetch — render header only.
  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      {header}
    </Box>
  );
};

export default AgreementSigningStep;
