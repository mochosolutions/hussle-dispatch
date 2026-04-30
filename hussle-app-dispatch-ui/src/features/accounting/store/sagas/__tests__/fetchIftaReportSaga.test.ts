import { runSaga } from 'redux-saga';
import { fetchIftaReportSaga } from '../fetchIftaReportSaga';
import * as iftaApi from 'utils/api/accounting/iftaApi';
import {
  fetchIftaReportRequest,
  fetchIftaReportSuccess,
  fetchIftaReportFailure,
} from '../../reducers/iftaPageSlice';
import { notify } from 'features/ui/store/reducers/notificationSlice';

describe('fetchIftaReportSaga', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches success when the API returns a report', async () => {
    const report = {
      year: 2026,
      quarter: 1,
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      vehicles: [],
      fleetTotals: { totalMiles: 0, totalGallons: 0, totalFuelCost: 0, averageMpg: 0 },
    };
    const spy = jest.spyOn(iftaApi, 'getIftaReport').mockResolvedValue(report);

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      fetchIftaReportSaga,
      fetchIftaReportRequest({ year: 2026, quarter: 1 }),
    ).toPromise();

    expect(spy).toHaveBeenCalledWith({ year: 2026, quarter: 1 });
    expect(dispatched).toContainEqual(fetchIftaReportSuccess(report));
  });

  it('dispatches failure and shows error toast when the API call fails', async () => {
    jest.spyOn(iftaApi, 'getIftaReport').mockRejectedValue(new Error('network'));

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      fetchIftaReportSaga,
      fetchIftaReportRequest({ year: 2026, quarter: 1 }),
    ).toPromise();

    expect(dispatched).toContainEqual(fetchIftaReportFailure('network'));
    expect(dispatched).toContainEqual(
      expect.objectContaining({
        type: notify.type,
        payload: expect.objectContaining({
          message: 'Failed to load IFTA report',
          variant: 'error',
        }),
      }),
    );
  });
});
