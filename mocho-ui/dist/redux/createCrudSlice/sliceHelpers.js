import { LoadingState } from "../types/loadingState.js";
function ensureMaps(state) {
  if (!state.loading) state.loading = {};
  if (!state.errors) state.errors = {};
}
function setPending(state, {
  key
}) {
  ensureMaps(state);
  state.loading[key] = LoadingState.Pending;
}
function setFulfilled(state, {
  loadingKey,
  errorKey
}) {
  ensureMaps(state);
  state.loading[loadingKey] = LoadingState.Fulfilled;
  state.errors[errorKey] = "";
}
function setRejected(state, {
  loadingKey,
  errorKey,
  failureMessage
}) {
  ensureMaps(state);
  state.loading[loadingKey] = LoadingState.Rejected;
  state.errors[errorKey] = failureMessage;
}
export {
  ensureMaps,
  setFulfilled,
  setPending,
  setRejected
};
//# sourceMappingURL=sliceHelpers.js.map
