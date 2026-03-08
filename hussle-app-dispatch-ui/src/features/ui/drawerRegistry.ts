import type { PopupComponentMap } from '../../mocho/types/popup';
import { CompanyInfoDrawer } from '../carrier/components/CompanyInfoDrawer';
import { DispatchTermsDrawer } from '../carrier/components/DispatchTermsDrawer';
import { DriverInfoDrawer } from '../driver/components/DriverInfoDrawer';
import { VehicleInfoDrawer } from '../vehicle/components/VehicleInfoDrawer';

const drawerRegistry: PopupComponentMap = {
  carrierCompanyInfo: CompanyInfoDrawer,
  carrierDispatchTerms: DispatchTermsDrawer,
  vehicleInfo: VehicleInfoDrawer,
  driverInfo: DriverInfoDrawer,
};

export default drawerRegistry;
