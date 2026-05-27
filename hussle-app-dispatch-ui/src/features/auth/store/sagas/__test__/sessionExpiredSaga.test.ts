import { call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { closeSnackbar } from 'notistack';

import { sessionExpiredSaga } from '../sessionExpiredSaga';
import { sessionExpired } from '../../authSlice';
import { resetPopups } from 'features/ui/store/reducers/uiSlice';
import { getNavigate } from 'utils/getNavigate';
import { SessionExpiredContext } from '../../../types';

jest.mock('utils/getNavigate', () => ({
  getNavigate: jest.fn(),
}));

jest.mock('notistack', () => ({
  closeSnackbar: jest.fn(),
}));

describe('sessionExpiredSaga', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to /login when context is main', async () => {
    const navigateMock = jest.fn();
    const action = sessionExpired({ context: SessionExpiredContext.MAIN });

    await expectSaga(sessionExpiredSaga, action)
      .provide([
        [call(getNavigate), navigateMock],
        [call(closeSnackbar), undefined],
        [call(navigateMock, '/login'), undefined],
      ])
      .put(resetPopups())
      .call(closeSnackbar)
      .call(getNavigate)
      .call(navigateMock, '/login')
      .run();
  });

  it('falls back to a warning when getNavigate throws (no navigate dispatched)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const action = sessionExpired({ context: SessionExpiredContext.MAIN });

    await expectSaga(sessionExpiredSaga, action)
      .provide([
        [call(getNavigate), throwError(new Error('no navigate'))],
        [call(closeSnackbar), undefined],
      ])
      .put(resetPopups())
      .call(closeSnackbar)
      .not.put(sessionExpired({ context: SessionExpiredContext.MAIN }))
      .run();

    expect(warnSpy).toHaveBeenCalledWith(
      'sessionExpiredSaga: navigate unavailable; relying on AuthGuard',
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });

  it('returns immediately when context is portal (no navigate, no resetPopups)', async () => {
    const action = sessionExpired({ context: SessionExpiredContext.PORTAL });

    const result = await expectSaga(sessionExpiredSaga, action).run();

    expect(result.effects.put).toBeUndefined();
    expect(result.effects.call).toBeUndefined();
  });
});
