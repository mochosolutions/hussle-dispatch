# Registry: hussle-app-dispatch-api

> Express + Prisma + Redis + RabbitMQ API — `hussle-app-dispatch-api/`

---

## 1. Inventory

### Database Models (Prisma)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| Organization | name, slug, email, vertical, role, status, subscriptionTier | memberships, invitations, carriers, loads, places, documents, customers |
| User | externalId, email, firstName, lastName | memberships, invitations, statusChanges, checkCalls |
| Membership | userId, organizationId, role, status | user, organization, invitedBy |
| Invitation | email, role, token, status, expiresAt | organization, invitedBy |
| Carrier | name, type, mcNumber, dotNumber, dispatchFeePercent, billingMethod, status | managedByOrg, drivers, vehicles, loads, invoices |
| Driver | firstName, lastName, phone, cdlNumber, currentCity/State, homeBaseCity/State, status | carrier, loads, assignedVehicle |
| Vehicle | unitNumber, type, ownership, monthlyGrossTarget | carrier, driver, loads, expenses |
| TruckExpense | category, expenseKey, label, monthlyAmount | vehicle |
| Load | loadNumber, equipmentType, customerRate, carrierRate, status, invoiceReadiness | organization, carrier, driver, vehicle, customer, stops, accessorialCharges, invoices |
| Stop | type, sequence, address, city, state, appointmentDate | load, place, facility(Contact) |
| Place | name, city, state, latitude, longitude, facilityType, geoSource | organization, contact, customer, stops |
| Customer | type, companyName, mcNumber, paymentTerms, status | organization, contacts, loads, places, invoices |
| Document | entityType, entityId, type, s3Key, uploadStatus | organization, accessorialCharges |
| Invoice | invoiceNumber, type, subtotal, totalAmount, status, billingMethod | load, carrier, customer |
| AccessorialCharge | type, amount, billTo, approvalStatus | load, document |
| OrgSettings | defaultTonuFee, weeklyGrossTarget, invoiceWorkflow, backhaulSearchRadiusMiles | organization |
| CheckCall | location, latitude, longitude, eta, brokerNotified | load, calledBy(User) |
| LoadStatusHistory | fromStatus, toStatus, notes | load, changedBy(User) |
| CustomerNotificationSettings | trigger, channel, enabled, recipientEmail | customer |
| LoadNotificationOverride | trigger, channel, enabled | load |
| LoadTrackingToken | token, type, expiresAt | load |
| NotificationLog | trigger, channel, recipientEmail, status | load |
| AuditLog | action, entityType, entityId, changes | -- |
| CarrierNote | text, authorId, authorName | carrier |

### Feature Modules

| Module | Routes | Controllers | Services | CompositionRoot |
|--------|--------|-------------|----------|-----------------|
| auth | -- (inline) | auth/\*, invite/\*, membership/\*, orgs/\*, previewToken/\*, user/\* | auth/\*, invite/\*, membership/\*, orgs/\*, previewToken/\*, user/\* | Yes |
| loads | loadRoutes | loadController, transitionStatusController, weeklyGrossController | loadService, stopService, accessorialService | Yes |
| carriers | carrierRoutes | carrierController | carrierService | Yes |
| drivers | driverRoutes | driverController | driverService | Yes |
| vehicles | vehicleRoutes | vehicleController | vehicleService | Yes |
| customers | customerRoutes | customerController | customerService | Yes |
| places | placeRoutes | placeController, routeDistanceController | placeService, routeDistanceService, addressSearchService | Yes |
| documents | documentRoutes | documentController, bulkDownloadController | -- (controller-level) | Yes |
| invoices | invoiceRoutes | invoiceController, invoiceBuilderController, pdfController, documentPacketController | invoiceBuilderService, pdfGenerationService, documentPacketService, invoiceEmailService | Yes |
| load-intel | loadIntelRoutes | getFeedController, backhaulController, chainController, bookController, marketDataControllers | loadIntelService, loadIntelFeedService, backhaulService, bookService, marketDataService, chainService | Yes |
| notifications | notificationRoutes | notificationSettingsController, loadNotificationController, trackingController | notificationSettingsService, loadNotificationOverrideService, trackingTokenService, notificationSubscriber | Yes |
| dashboard | dashboardRoutes | dashboardController | -- (controller-level) | Yes |
| contacts | contactRoutes | contactController | -- (via repository) | Yes |
| settings | settingsRoutes | settingsController | settingsService | Yes |
| maps | mapRoutes | mapTileController | -- | Yes |
| driver-portal | driverPortalRoutes | driverPortalController, sendDriverLinkController | driverPortalService | Yes |

### Middleware

| Name | Path | Purpose |
|------|------|---------|
| authorizeUser | shared/middleware/authorizeUser.ts | Claims-based role gating |
| validateRequest | shared/middleware/validateRequest.ts | Yup schema validation |
| requireAuthOrInviteToken | shared/middleware/requireAuthOrInviteToken.ts | Auth or invite token for public routes |

### Shared Utilities

| Name | Path | Purpose |
|------|------|---------|
| responseEnvelope | shared/responseEnvelope.ts | `sendSingle` / `sendList` response helpers |
| pagination | shared/pagination.ts | `parsePaginationParams` / `paginateQuery` |
| financials | shared/financials.ts | Fee, split, RPM calculations |
| onboardingGate | shared/onboardingGate.ts | Carrier onboarding completeness check |
| geoLookup | shared/geoLookup.ts | Geocoding / reverse geocoding |
| s3Presign | shared/s3Presign.ts | S3 presigned URL generation |
| loadQueries | shared/loadQueries.ts | Shared load query includes |
| redisClient | shared/redisClient.ts | Redis connection singleton |
| repositoryFactoryPrisma | shared/utils/repositoryFactoryPrisma.ts | Generic Prisma repo factory |
| distanceCalculator | shared/utils/distanceCalculator.ts | Haversine distance |
| assertEntityExists | shared/utils/assertEntityExists.ts | Generic not-found guard |
| sharedEventBus | shared/messaging/sharedEventBus.ts | In-process event bus |

### Scoring Utilities

| Name | Path | Purpose |
|------|------|---------|
| calculateCpm | shared/scoring/calculateCpm.ts | Cost-per-mile from expenses |
| calculateDriverFit | shared/scoring/calculateDriverFit.ts | Driver-to-load fit score |
| calculateCompositeScore | shared/scoring/calculateCompositeScore.ts | Weighted composite score |
| calculateChainScore | shared/scoring/calculateChainScore.ts | Multi-load chain scoring |
| calculateMinBookRate | shared/scoring/calculateMinBookRate.ts | Minimum profitable rate |
| normalizeDriverPreferences | shared/scoring/normalizeDriverPreferences.ts | Preference normalization |

### Error Classes (`shared/errors/`)

| Class | Status | Code |
|-------|--------|------|
| NotFoundError | 404 | NOT_FOUND |
| ValidationError | 400 | VALIDATION_ERROR |
| ConflictError | 409 | CONFLICT |
| UnauthorizedError | 401 | UNAUTHORIZED |
| ForbiddenError | 403 | FORBIDDEN |
| InvalidTransitionError | 422 | INVALID_STATUS_TRANSITION |
| OnboardingBlockError | 422 | ONBOARDING_INCOMPLETE |
| AssignmentValidationError | 422 | ASSIGNMENT_BLOCKED |
| ActiveLoadsConflictError | 409 | ACTIVE_LOADS |
| InsuranceExpiredError | 422 | INSURANCE_EXPIRED |
| ProhibitedCommodityError | 422 | PROHIBITED_COMMODITY |
| ConcurrentEditError | 409 | CONCURRENT_EDIT |
| OwnerOperatorNotSupportedError | 422 | OWNER_OPERATOR_NOT_SUPPORTED |
| SequenceError | 500 | SEQUENCE_ERROR |
| AuthRequestError | varies | AUTH_REQUEST_ERROR |
| GoneError | 410 | GONE |
| RequestValidationError | 400 | REQUEST_VALIDATION_ERROR |
| StorageFileNotFoundError | 404 | -- |
| StorageWriteError | 500 | -- |
| DocumentNotFoundError | 404 | -- |

---

## 2. Key Enums

```
LoadStatus: QUOTED | BOOKED | DISPATCHED | EN_ROUTE_PICKUP | AT_PICKUP | IN_TRANSIT | AT_DELIVERY | DELIVERED | INVOICE_PENDING | INVOICED | PAID | EXCEPTION | CANCELED | TONU
CarrierType: COMPANY_ASSET | OWNER_OPERATOR | EXTERNAL_CARRIER
EquipmentType: DRY_VAN | REEFER | FLATBED | STEP_DECK | BOX_TRUCK | HOTSHOT | POWER_ONLY
StopType: PICKUP | DELIVERY | STOP_OFF | DROP_HOOK | LIVE_UNLOAD
DocumentType: BROKER_RATE_CON | BOL_UNSIGNED | BOL_SIGNED | DISPATCH_AGREEMENT | INSURANCE_CERT | W9 | CARRIER_PACKET | INVOICE | LUMPER_RECEIPT | SCALE_TICKET | POD | HAZMAT | LOA | DETENTION | LICENSE | REGISTRATION | INSPECTION_CERT | OTHER
InvoiceStatus: DRAFT | APPROVED | SENT | PARTIALLY_PAID | PAID | OVERDUE | VOID
CustomerType: BROKER | DIRECT_SHIPPER | THREE_PL
BillingMethod: DIRECT | FACTORED
NotificationTrigger: STATUS_CHANGE | CHECK_CALL | DOCUMENT_UPLOADED
AccessorialType: DETENTION | LUMPER | TONU | LAYOVER | DRIVER_ASSIST | FUEL_SURCHARGE | TARP | TOLL | OTHER
```

---

## 3. Representative Patterns

### Controller (load)

```typescript
export const createLoadControllers = (deps: LoadControllerDeps): LoadControllers => ({
  createLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createLoadMapper(req);
    const load = await deps.loadService.createLoad(serviceInput);
    sendSingle(res, toLoadDetailResponse(load), 201);
  },

  listLoads: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listLoadsMapper(req);
    const result = await deps.loadService.listLoads(serviceInput);
    const response = toLoadListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },
});
```

### Service (customer)

```typescript
export const createCustomerService = (deps: CustomerServiceDeps): CustomerService => ({
  createCustomer: async ({ organizationId, input }: CreateCustomerServiceInput) => {
    const existing = await deps.customerRepository.list({
      organizationId, filters: { search: input.companyName }, skip: 0, take: 1,
      orderBy: { createdAt: 'desc' },
    });
    const duplicate = existing.find(
      (c) => c.companyName.toLowerCase() === input.companyName.toLowerCase(),
    );
    if (duplicate !== undefined) {
      throw new ConflictError(`A customer with the name "${input.companyName}" already exists.`);
    }
    return deps.customerRepository.create(organizationId, input);
  },
});
```

### Composition Root (customer)

```typescript
export const createCustomersModule = ({ prismaClient }: CustomerModuleDeps): {
  controllers: CustomerControllers;
} => {
  const customerRepository = customerRepositoryPrisma(prismaClient);
  const customerService = createCustomerService({ customerRepository });
  const controllers = createCustomerControllers({ customerService });
  return { controllers };
};
```

### Test (customer service)

```typescript
describe('customerService', () => {
  const mockRepository = buildMockRepository();
  const customerService = createCustomerService({ customerRepository: mockRepository });

  beforeEach(() => { jest.clearAllMocks(); });

  it('creates customer when input is valid and companyName is unique', async () => {
    mockRepository.list.mockResolvedValue([]);
    mockRepository.create.mockResolvedValue(buildCustomer());
    const result = await customerService.createCustomer({
      organizationId: ORG_ID, role: 'admin',
      input: { type: CustomerType.BROKER, companyName: 'Acme Logistics' },
    });
    expect(mockRepository.create).toHaveBeenCalledWith(ORG_ID, expect.objectContaining({ companyName: 'Acme Logistics' }));
    expect(result.id).toBe(CUSTOMER_ID);
  });

  it('throws ConflictError when companyName already exists', async () => {
    mockRepository.list.mockResolvedValue([buildCustomer()]);
    await expect(customerService.createCustomer({
      organizationId: ORG_ID, role: 'admin',
      input: { type: CustomerType.BROKER, companyName: 'Acme Logistics' },
    })).rejects.toBeInstanceOf(ConflictError);
  });
});
```

### Error Handling (typed error)

```typescript
export class InvalidTransitionError extends CustomError {
  statusCode = 422;
  readonly code = 'INVALID_STATUS_TRANSITION';
  readonly currentStatus: string;
  readonly targetStatus: string;
  readonly allowedTransitions: string[];

  constructor(currentStatus: string, targetStatus: string, allowedTransitions: string[]) {
    super(`Cannot move to ${targetStatus}. Allowed: ${allowedTransitions.join(', ')}`);
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.allowedTransitions = allowedTransitions;
    Object.setPrototypeOf(this, InvalidTransitionError.prototype);
  }

  serializeErrors() { return [{ message: this.message }]; }
}
```
