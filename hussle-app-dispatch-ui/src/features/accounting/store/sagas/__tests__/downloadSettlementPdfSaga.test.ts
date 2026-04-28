import { runSaga } from 'redux-saga';
import { downloadSettlementPdfSaga } from '../downloadSettlementPdfSaga';
import * as settlementApi from 'utils/api/accounting/settlementApi';
import {
  downloadSettlementPdfRequest,
  downloadSettlementPdfSuccess,
  downloadSettlementPdfFailure,
} from '../../reducers/settlementPageSlice';

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));

describe('downloadSettlementPdfSaga', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:fake');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    jest.restoreAllMocks();
  });

  it('fetches the PDF blob and dispatches success', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const spy = jest
      .spyOn(settlementApi, 'downloadSettlementPdf')
      .mockResolvedValue(blob);

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      downloadSettlementPdfSaga,
      downloadSettlementPdfRequest({ id: 's1', shortId: 'S-0001' }),
    ).toPromise();

    expect(spy).toHaveBeenCalledWith('s1');
    expect(dispatched).toContainEqual(downloadSettlementPdfSuccess({ id: 's1' }));
  });

  it('dispatches failure when the API call fails', async () => {
    jest
      .spyOn(settlementApi, 'downloadSettlementPdf')
      .mockRejectedValue(new Error('network'));

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      downloadSettlementPdfSaga,
      downloadSettlementPdfRequest({ id: 's1' }),
    ).toPromise();

    expect(dispatched).toContainEqual(
      downloadSettlementPdfFailure({ id: 's1', error: 'network' }),
    );
  });
});
