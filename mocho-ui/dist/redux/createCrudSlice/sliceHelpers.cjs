"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const loadingState = require("../types/loadingState.cjs");
function ensureMaps(state) {
  if (!state.loading) state.loading = {};
  if (!state.errors) state.errors = {};
}
function setPending(state, {
  key
}) {
  ensureMaps(state);
  state.loading[key] = loadingState.LoadingState.Pending;
}
function setFulfilled(state, {
  loadingKey,
  errorKey
}) {
  ensureMaps(state);
  state.loading[loadingKey] = loadingState.LoadingState.Fulfilled;
  state.errors[errorKey] = "";
}
function setRejected(state, {
  loadingKey,
  errorKey,
  failureMessage
}) {
  ensureMaps(state);
  state.loading[loadingKey] = loadingState.LoadingState.Rejected;
  state.errors[errorKey] = failureMessage;
}
exports.ensureMaps = ensureMaps;
exports.setFulfilled = setFulfilled;
exports.setPending = setPending;
exports.setRejected = setRejected;
//# sourceMappingURL=sliceHelpers.cjs.map
