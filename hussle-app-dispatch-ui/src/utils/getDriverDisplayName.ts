interface DriverName {
  firstName: string;
  lastName: string;
}

const getDriverDisplayName = (driver: DriverName): string =>
  `${driver.firstName} ${driver.lastName}`.trim();

export default getDriverDisplayName;
