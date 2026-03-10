import type { PopupComponentMap } from '../../mocho/types/popup';
import { CompanyInfoDrawer } from '../carrier/components/CompanyInfoDrawer';
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

const drawerRegistry: PopupComponentMap = {
  carrierCompanyInfo: CompanyInfoDrawer,
  carrierDispatchTerms: DispatchTermsDrawer,
  vehicleInfo: VehicleInfoDrawer,
  vehicleExpenses: VehicleExpenseDrawer,
  vehicleTargets: VehicleTargetsDrawer,
  driverInfo: DriverInfoDrawer,
  driverPreferences: DriverPreferencesDrawer,
  driverLocation: DriverLocationDrawer,
  placeInfo: PlaceInfoDrawer,
  loadDetail: LoadWorkspaceDrawer,
  manualEntry: ManualEntryDrawer,
  loadRoute: LoadRouteDrawer,
  loadCargo: LoadCargoDrawer,
  loadAssignment: LoadAssignmentDrawer,
};

export default drawerRegistry;
