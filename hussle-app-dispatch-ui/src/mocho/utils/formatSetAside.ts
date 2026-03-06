function formatSetAside(typeOfSetAside) {
  if (typeOfSetAside) {
    return `${typeOfSetAside}`;
  } else {
    return 'N/A';
  }
}

export default formatSetAside;
