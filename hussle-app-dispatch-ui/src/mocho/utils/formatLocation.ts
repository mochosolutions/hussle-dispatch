function formatLocation(location) {
  const {city, stateCode} = location;
  // const { name: cityName } = city;
  // const { code: stateCode } = state;

  if (city && stateCode) {
    return `${city}, ${stateCode}`;
  } else {
    return 'N/A';
  }
}

export default formatLocation;
