export interface OrganizationHeadquartersLocation {
  latitude: number | null;
  longitude: number | null;
}

export interface OrganizationQueryPort {
  findHeadquartersLocation(organizationId: string): Promise<OrganizationHeadquartersLocation | null>;
}
