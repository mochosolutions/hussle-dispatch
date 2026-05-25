import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga/effects';

import type { Session } from 'features/carrier-portal/engine';
import * as api from 'utils/api/carrierPortal/v2';
import { getNavigate } from 'mocho/utils/getNavigate';

import { saveCompanySaga } from '../saveCompanySaga';
import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../reducers/carrierPortalSlice';

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));

const baseSession: Session = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'company-authority-question',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'c@test.com' },
};

const buildState = (overrides: Partial<{ token: string | null; session: Session | null }> = {}) => {
  const base = carrierPortalV2Reducer(undefined, { type: '@@INIT' });
  return {
    pages: {
      carrierPortalV2: {
        ...base,
        token: overrides.token ?? 'tok-1',
        session: overrides.session ?? baseSession,
      },
    },
  };
};

const submitStepRow = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'equipment-entry',
  completedStepIds: ['company-authority-question'],
  answers: {},
};

describe('saveCompanySaga', () => {
  beforeEach(() => jest.clearAllMocks());

  it('happy path: saves fields and dispatches success WITHOUT calling void-for-resign', () =>
    expectSaga(saveCompanySaga)
      .withState(buildState())
      .provide([
        [call(api.saveCompanyV2, 'tok-1', { legalName: 'New' }), undefined as never],
        [
          call(api.submitStepV2, 'tok-1', {
            stepId: 'company-authority-question',
            answers: { hasMcAuthority: 'yes' },
          }),
          submitStepRow as never,
        ],
      ])
      .put(carrierPortalV2Actions.saveCompanySuccess())
      .not.call.fn(api.voidForReSignV2)
      .dispatch(
        carrierPortalV2Actions.saveCompany({
          fields: { legalName: 'New' },
          hasMcAuthority: 'yes',
        }),
      )
      .silentRun());

  it('void-and-resign: calls voidForReSignV2 BEFORE saveCompany when voidPriorAgreements=true', () => {
    const navigateMock = jest.fn();

    return expectSaga(saveCompanySaga)
      .withState(buildState())
      .provide([
        [
          call(api.voidForReSignV2, 'tok-1', { changedFields: ['legalName'] }),
          { voidedAgreementIds: ['agr-1'] },
        ],
        [call(api.saveCompanyV2, 'tok-1', { legalName: 'New' }), undefined as never],
        [
          call(api.submitStepV2, 'tok-1', {
            stepId: 'company-authority-question',
            answers: {},
          }),
          submitStepRow as never,
        ],
        [call(getNavigate), navigateMock],
        [call(navigateMock, '/carrier-portal/tok-1/sign-agreement'), undefined],
      ])
      .call(api.voidForReSignV2, 'tok-1', { changedFields: ['legalName'] })
      .call(api.saveCompanyV2, 'tok-1', { legalName: 'New' })
      .put(carrierPortalV2Actions.saveCompanySuccess())
      .dispatch(
        carrierPortalV2Actions.saveCompany({
          fields: { legalName: 'New' },
          voidPriorAgreements: true,
          changedIdentityFields: ['legalName'],
        }),
      )
      .silentRun();
  });
});
