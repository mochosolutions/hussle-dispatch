import { setPending, setFulfilled, setRejected } from 'utils/authSliceHelpers';

type CrudOperation = 'create' | 'read' | 'update' | 'delete';

export function createCrudReducers(entity: string, operations: CrudOperation[] = ['create', 'read', 'update', 'delete']) {
  const reducers: Record<string, any> = {};

  operations.forEach((op) => {
    const capitalized = op.charAt(0).toUpperCase() + op.slice(1);

    reducers[`${op}${entity}Request`] = (state: any) => {
      setPending(state, { key: op });
    };
    reducers[`${op}${entity}Success`] = (state: any) => {
      setFulfilled(state, { loadingKey: op, errorKey: op });
    };
    reducers[`${op}${entity}Failure`] = (state: any) => {
      setRejected(state, {
        loadingKey: op,
        errorKey: op,
        failureMessage: `${capitalized} failed`,
      });
    };
  });

  return reducers;
}