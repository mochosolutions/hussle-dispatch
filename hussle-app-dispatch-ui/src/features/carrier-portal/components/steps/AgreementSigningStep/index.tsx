// ---------------------------------------------------------------------------
// AgreementSigningStep — URL-driven router for the agreement-signing experience.
//
// Routes (relative to /carrier-portal/:token):
//   /sign-agreement              → AgreementListView (home base for the list)
//   /sign-agreement/:key         → AgreementFocusView (signing surface)
//   /sign-agreement/:key/signed  → AgreementSuccessView (interstitial)
//
// The wildcard splat (`:stepId/*`) in CarrierPortalRoutes lets us read trailing
// segments via useParams().*. Empty splat = list; one segment = focus; two
// segments ending in 'signed' = success.
//
// On mount, dispatch fetchAgreements({ templateKeys: visibleKeys }) once so
// the record is populated before any view tries to render.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDispatch, useSelector } from 'store';

import type { Step } from 'features/carrier-portal/engine';

import {
  selectSession,
  selectVisibleAgreementKeys,
} from '../../../store/selectors/carrierPortalSelectors';
import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import AgreementListView from './AgreementListView';
import AgreementFocusView from './AgreementFocusView';
import AgreementSuccessView from './AgreementSuccessView';

interface AgreementSigningStepProps {
  step: Step;
}

interface ParsedRoute {
  view: 'list' | 'focus' | 'success';
  agreementKey?: string;
}

const parseSplat = (splat: string | undefined): ParsedRoute | null => {
  if (!splat || splat.length === 0) {
    return { view: 'list' };
  }
  const segments = splat.split('/').filter(Boolean);
  if (segments.length === 1) {
    return { view: 'focus', agreementKey: segments[0] };
  }
  if (segments.length === 2 && segments[1] === 'signed') {
    return { view: 'success', agreementKey: segments[0] };
  }
  return null;
};

const AgreementSigningStep: React.FC<AgreementSigningStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams<{ token?: string; stepId?: string; '*'?: string }>();
  const session = useSelector(selectSession);

  const visibleKeys = useMemo(() => selectVisibleAgreementKeys(session), [session]);

  // Initial fetch — once per mount, gated on session presence.
  const fetchDispatched = useRef(false);
  useEffect(() => {
    if (fetchDispatched.current) return;
    if (!session || visibleKeys.length === 0) return;
    fetchDispatched.current = true;
    dispatch(carrierPortalV2Actions.fetchAgreements({ templateKeys: visibleKeys }));
  }, [dispatch, session, visibleKeys]);

  // Snap malformed trailing segments back to the list view.
  const parsed = parseSplat(params['*']);
  useEffect(() => {
    if (parsed !== null) return;
    if (!params.token) return;
    navigate(`/carrier-portal/${params.token}/sign-agreement`, { replace: true });
  }, [parsed, params.token, navigate]);

  if (!session || !parsed) {
    return null;
  }

  if (parsed.view === 'list') {
    return <AgreementListView step={step} />;
  }
  if (parsed.view === 'focus' && parsed.agreementKey) {
    return <AgreementFocusView agreementKey={parsed.agreementKey} />;
  }
  if (parsed.view === 'success' && parsed.agreementKey) {
    return <AgreementSuccessView agreementKey={parsed.agreementKey} />;
  }
  return null;
};

export default AgreementSigningStep;
