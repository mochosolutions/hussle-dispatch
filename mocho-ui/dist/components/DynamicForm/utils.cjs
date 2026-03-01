"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function getFieldValue(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === void 0) return void 0;
    return acc[key];
  }, obj);
}
function getGridBreakpoints(grid) {
  return grid || {
    xs: 12,
    md: 6
  };
}
exports.getFieldValue = getFieldValue;
exports.getGridBreakpoints = getGridBreakpoints;
//# sourceMappingURL=utils.cjs.map
