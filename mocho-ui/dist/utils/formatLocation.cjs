"use strict";
function formatLocation(location) {
  const {
    city,
    stateCode
  } = location;
  if (city && stateCode) {
    return `${city}, ${stateCode}`;
  } else {
    return "N/A";
  }
}
module.exports = formatLocation;
//# sourceMappingURL=formatLocation.cjs.map
