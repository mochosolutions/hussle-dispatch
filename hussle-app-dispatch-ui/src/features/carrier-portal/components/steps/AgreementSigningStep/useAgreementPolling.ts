import { useEffect } from 'react';

import { useDispatch, useSelector } from 'store';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { selectAgreements } from '../../../store/selectors/carrierPortalSelectors';

const POLL_INTERVAL_MS = 4000;

/**
 * While any agreement in the visible set has status === 'PENDING', re-fetch
 * every 4s. Stops cleanly once nothing PENDING remains.
 *
 * `visibleKeys` is the ordered list from selectVisibleAgreementKeys(session);
 * caller computes it once and passes in.
 */
export const useAgreementPolling = (visibleKeys: string[]): void => {
  const dispatch = useDispatch();
  const agreements = useSelector(selectAgreements);

  const hasPending = visibleKeys.some((key) => agreements[key]?.status === 'PENDING');

  useEffect(() => {
    if (!hasPending || visibleKeys.length === 0) {
      return undefined;
    }
    const handle = window.setInterval(() => {
      dispatch(carrierPortalV2Actions.fetchAgreements({ templateKeys: visibleKeys }));
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [hasPending, visibleKeys, dispatch]);
};
