import axiosInstance from 'utils/axios';
import type {
  WeeklyScheduleEntry,
  ScheduleOverride,
  CreateScheduleOverrideInput,
} from 'features/driver/types';

export const getWeeklySchedule = async (
  driverId: string,
): Promise<WeeklyScheduleEntry[]> => {
  const response = await axiosInstance.get<{ data: WeeklyScheduleEntry[] }>(
    `/drivers/${driverId}/availability/weekly`,
  );
  return response.data.data;
};

export const setWeeklySchedule = async (
  driverId: string,
  entries: WeeklyScheduleEntry[],
): Promise<WeeklyScheduleEntry[]> => {
  const response = await axiosInstance.put<{ data: WeeklyScheduleEntry[] }>(
    `/drivers/${driverId}/availability/weekly`,
    { entries },
  );
  return response.data.data;
};

export const listOverrides = async (
  driverId: string,
  fromDate?: string,
  toDate?: string,
): Promise<ScheduleOverride[]> => {
  const params: Record<string, string> = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  const response = await axiosInstance.get<{ data: ScheduleOverride[] }>(
    `/drivers/${driverId}/availability/overrides`,
    { params },
  );
  return response.data.data;
};

export const createOverride = async (
  driverId: string,
  data: CreateScheduleOverrideInput,
): Promise<ScheduleOverride> => {
  const response = await axiosInstance.post<{ data: ScheduleOverride }>(
    `/drivers/${driverId}/availability/overrides`,
    data,
  );
  return response.data.data;
};

export const deleteOverride = async (
  driverId: string,
  overrideId: string,
): Promise<void> => {
  await axiosInstance.delete(
    `/drivers/${driverId}/availability/overrides/${overrideId}`,
  );
};
