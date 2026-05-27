import type { PopupComponentMap } from '../../mocho/types/popup';
import { CompanyInfoDrawer } from '../carrier/components/CompanyInfoDrawer';
import { CarrierNoteDrawer } from '../carrier/components/CarrierNoteDrawer';
import { DispatchTermsDrawer } from '../carrier/components/DispatchTermsDrawer';
import { DriverFormDrawer } from '../driver/components/DriverFormDrawer';
import { DriverPreferencesDrawer } from '../driver/components/DriverPreferencesDrawer';
import { DriverLocationDrawer } from '../driver/components/DriverLocationDrawer';
import { DriverWeeklyScheduleDrawer } from '../driver/components/DriverWeeklyScheduleDrawer';
import { DriverScheduleOverrideDrawer } from '../driver/components/DriverScheduleOverrideDrawer';
import { ManualEntryDrawer } from '../loadintelligence/components/ManualEntryDrawer';
import { PlaceInfoDrawer } from '../place/components/PlaceInfoDrawer';
import { VehicleInfoDrawer } from '../vehicle/components/VehicleInfoDrawer';
import { VehicleExpenseDrawer } from '../vehicle/components/VehicleExpenseDrawer';
import { VehicleTargetsDrawer } from '../vehicle/components/VehicleTargetsDrawer';

import { LoadRouteDrawer } from '../load/components/LoadRouteDrawer';
import { LoadCargoDrawer } from '../load/components/LoadCargoDrawer';
import { LoadAssignmentDrawer } from '../load/components/LoadAssignmentDrawer';
import { LoadRateDrawer } from '../load/components/LoadRateDrawer';
import { LoadContactDrawer } from '../load/components/LoadContactDrawer';
import { AccessorialDrawer } from '../load/components/AccessorialDrawer';
import { LoadCheckCallDrawer } from '../load/components/LoadCheckCallDrawer';

import { CustomerCompanyInfoDrawer } from '../customer/components/CustomerCompanyInfoDrawer';
import { VehicleCreateDrawer } from '../vehicle/components/VehicleCreateDialog';
import { CarrierFormDrawer } from '../carrier/components/CarrierFormDialog';
import { ContactInfoDrawer } from '../contact/components/ContactInfoDrawer';
import { ContactEditDrawer } from '../contact/components/ContactEditDrawer';
import { DocumentUploadDrawer } from '../documents/components/DocumentUploadDrawer';
import { DocumentDetailDrawer } from '../documents/components/DocumentDetailDrawer';
import { DisputeSettlementDrawer } from '../accounting/components/DisputeSettlementDrawer';
import { AddAdjustmentDrawer } from '../accounting/components/AddAdjustmentDrawer';
import { ExpenseQuickAddDrawer } from '../accounting/components/ExpenseQuickAddDrawer';
import { PaySettlementDrawer } from '../accounting/components/PaySettlementDrawer';

const drawerRegistry: PopupComponentMap = {
  carrierCompanyInfo: CompanyInfoDrawer,
  customerCompanyInfo: CustomerCompanyInfoDrawer,
  carrierDispatchTerms: DispatchTermsDrawer,
  carrierNote: CarrierNoteDrawer,
  vehicleInfo: VehicleInfoDrawer,
  vehicleExpenses: VehicleExpenseDrawer,
  vehicleTargets: VehicleTargetsDrawer,
  driverInfo: DriverFormDrawer,
  driverPreferences: DriverPreferencesDrawer,
  driverLocation: DriverLocationDrawer,
  driverWeeklySchedule: DriverWeeklyScheduleDrawer,
  driverScheduleOverride: DriverScheduleOverrideDrawer,
  placeInfo: PlaceInfoDrawer,
  manualEntry: ManualEntryDrawer,
  vehicleCreate: VehicleCreateDrawer,
  driverCreate: DriverFormDrawer,
  carrierForm: CarrierFormDrawer,
  contactCreate: ContactInfoDrawer,
  contactInfo: ContactEditDrawer,
  documentUpload: DocumentUploadDrawer,
  documentDetail: DocumentDetailDrawer,

  // Load specific drawers
  loadRate: LoadRateDrawer,
  loadContact: LoadContactDrawer,
  loadRoute: LoadRouteDrawer,
  loadCargo: LoadCargoDrawer,
  loadAssignment: LoadAssignmentDrawer,
  loadAccessorial: AccessorialDrawer,
  loadCheckCall: LoadCheckCallDrawer,

  // Accounting drawers
  disputeSettlement: DisputeSettlementDrawer,
  addAdjustment: AddAdjustmentDrawer,
  expenseQuickAdd: ExpenseQuickAddDrawer,
  paySettlement: PaySettlementDrawer,
};

export default drawerRegistry;
