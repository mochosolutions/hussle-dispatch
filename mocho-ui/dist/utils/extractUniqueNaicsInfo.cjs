"use strict";
function extractUniqueNaicsInfo(notices) {
  const uniqueNaicsMap = /* @__PURE__ */ new Map();
  notices.forEach((notice) => {
    const naicsCode = notice?.naicsStats?.naicsCode ?? "Not Defined";
    const description = notice?.naicsStats?.description ?? "";
    if (uniqueNaicsMap.has(naicsCode)) {
      const existingEntry = uniqueNaicsMap.get(naicsCode);
      existingEntry.occurrences += 1;
    } else {
      uniqueNaicsMap.set(naicsCode, {
        naicsCode,
        description,
        occurrences: 1
      });
    }
  });
  return Array.from(uniqueNaicsMap.values());
}
module.exports = extractUniqueNaicsInfo;
//# sourceMappingURL=extractUniqueNaicsInfo.cjs.map
