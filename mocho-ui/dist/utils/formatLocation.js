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
export {
  formatLocation as default
};
//# sourceMappingURL=formatLocation.js.map
