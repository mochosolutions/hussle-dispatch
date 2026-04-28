import axiosInstance from 'utils/axios';

interface DriverPortalLinkResponse {
  data: { url: string };
}

/**
 * Returns the driver portal URL for a load. Reuses the same token as the
 * Send Driver Link SMS flow — no SMS side-effect.
 *
 * Dispatcher-side endpoint, ADMIN/DISPATCHER only (enforced by API).
 */
export const getDriverPortalLink = async (loadId: string): Promise<string> => {
  const response = await axiosInstance.get<DriverPortalLinkResponse>(
    `/driver-portal/loads/${loadId}/driver-portal-link`,
  );
  return response.data.data.url;
};
