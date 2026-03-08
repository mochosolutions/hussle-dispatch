import type { PopupComponentMap } from '../../mocho/types/popup';
import { CompanyInfoDrawer } from '../carrier/components/CompanyInfoDrawer';
import { DispatchTermsDrawer } from '../carrier/components/DispatchTermsDrawer';
import { DriverInfoDrawer } from '../driver/components/DriverInfoDrawer';
import { LoadWorkspaceDrawer } from '../loadintelligence/components/LoadWorkspaceDrawer';
import { VehicleInfoDrawer } from '../vehicle/components/VehicleInfoDrawer';

const drawerRegistry: PopupComponentMap = {
  carrierCompanyInfo: CompanyInfoDrawer,
  carrierDispatchTerms: DispatchTermsDrawer,
  vehicleInfo: VehicleInfoDrawer,
  driverInfo: DriverInfoDrawer,
  loadDetail: LoadWorkspaceDrawer,
};

export default drawerRegistry;
