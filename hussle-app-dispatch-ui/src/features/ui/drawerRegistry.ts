import type { PopupComponentMap } from '../../mocho/types/popup';
import { CompanyInfoDrawer } from '../carrier/components/CompanyInfoDrawer';
import { CarrierNoteDrawer } from '../carrier/components/CarrierNoteDrawer';
import { DispatchTermsDrawer } from '../carrier/components/DispatchTermsDrawer';
import { DriverInfoDrawer } from '../driver/components/DriverInfoDrawer';
import { DriverPreferencesDrawer } from '../driver/components/DriverPreferencesDrawer';
import { DriverLocationDrawer } from '../driver/components/DriverLocationDrawer';
import { LoadWorkspaceDrawer } from '../loadintelligence/components/LoadWorkspaceDrawer';
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

import { CustomerCompanyInfoDrawer } from '../customer/components/CustomerCompanyInfoDrawer';
import { VehicleCreateDrawer } from '../vehicle/components/VehicleCreateDialog';
import { DriverCreateDrawer } from '../driver/components/DriverCreateDialog';
import { CarrierFormDrawer } from '../carrier/components/CarrierFormDialog';
import { ContactInfoDrawer } from '../contact/components/ContactInfoDrawer';
import { DocumentUploadDrawer } from '../documents/components/DocumentUploadDrawer';

const drawerRegistry: PopupComponentMap = {
  carrierCompanyInfo: CompanyInfoDrawer,
  customerCompanyInfo: CustomerCompanyInfoDrawer,
  carrierDispatchTerms: DispatchTermsDrawer,
  carrierNote: CarrierNoteDrawer,
  vehicleInfo: VehicleInfoDrawer,
  vehicleExpenses: VehicleExpenseDrawer,
  vehicleTargets: VehicleTargetsDrawer,
  driverInfo: DriverInfoDrawer,
  driverPreferences: DriverPreferencesDrawer,
  driverLocation: DriverLocationDrawer,
  placeInfo: PlaceInfoDrawer,
  loadDetail: LoadWorkspaceDrawer,
  manualEntry: ManualEntryDrawer,
  vehicleCreate: VehicleCreateDrawer,
  driverCreate: DriverCreateDrawer,
  carrierForm: CarrierFormDrawer,
  contactCreate: ContactInfoDrawer,
  documentUpload: DocumentUploadDrawer,

  // Load specific drawers
  loadRate: LoadRateDrawer,
  loadContact: LoadContactDrawer,
  loadRoute: LoadRouteDrawer,
  loadCargo: LoadCargoDrawer,
  loadAssignment: LoadAssignmentDrawer,
};

export default drawerRegistry;
