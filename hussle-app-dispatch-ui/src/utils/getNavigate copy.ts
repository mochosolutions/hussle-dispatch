import {getContext} from 'redux-saga/effects';

export function* getNavigate(): Generator<any, any, any> {
  const navigate = yield getContext('navigate');
  if (typeof navigate !== 'function') {
    throw new Error('Navigate function is not set or is not a function.');
  }
  const resolvedFunc = navigate();
  return resolvedFunc;
}
