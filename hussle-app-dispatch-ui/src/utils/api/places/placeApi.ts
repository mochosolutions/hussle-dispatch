import axiosInstance from 'utils/axios';
import type {
  Place,
  PlaceListItem,
  CreatePlaceInput,
  UpdatePlaceInput,
  PaginationMeta,
  AddressSearchResult,
} from 'features/place/types';

interface GetPlacesParams {
  page?: number;
  limit?: number;
  search?: string;
  facilityType?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetPlacesResponse {
  data: PlaceListItem[];
  meta: PaginationMeta;
}

interface GetPlaceResponse {
  data: Place;
}

interface TypeaheadPlacesResponse {
  data: PlaceListItem[];
}

export const getPlaces = async (
  params: GetPlacesParams,
): Promise<{ data: PlaceListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetPlacesResponse>('/places', { params });
  return response.data;
};

export const getPlace = async (id: string): Promise<Place> => {
  const response = await axiosInstance.get<GetPlaceResponse>(`/places/${id}`);
  return response.data.data;
};

export const createPlace = async (data: CreatePlaceInput): Promise<Place> => {
  const response = await axiosInstance.post<GetPlaceResponse>('/places', data);
  return response.data.data;
};

export const updatePlace = async (
  id: string,
  data: UpdatePlaceInput,
): Promise<Place> => {
  const response = await axiosInstance.patch<GetPlaceResponse>(`/places/${id}`, data);
  return response.data.data;
};

export const deletePlace = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/places/${id}`);
};

export const typeaheadPlaces = async (
  query: string,
  limit = 10,
): Promise<PlaceListItem[]> => {
  const response = await axiosInstance.get<TypeaheadPlacesResponse>('/places/typeahead', {
    params: { query, limit },
  });
  return response.data.data;
};

interface AddressSearchResponse {
  data: AddressSearchResult[];
}

export const searchAddresses = async (
  query: string,
  limit = 10,
): Promise<AddressSearchResult[]> => {
  const response = await axiosInstance.get<AddressSearchResponse>('/places/address-search', {
    params: { query, limit },
  });
  return response.data.data;
};

interface RouteDistanceLeg {
  distanceMiles: number;
  durationMinutes: number;
  isEstimated: boolean;
}

interface RouteDistanceResult {
  legs: RouteDistanceLeg[];
  totalMiles: number;
  totalMinutes: number;
  isEstimated: boolean;
}

interface RouteDistanceResponse {
  data: RouteDistanceResult;
}

interface Waypoint {
  lat: number;
  lng: number;
}

export const calculateRouteDistance = async (
  waypoints: Waypoint[],
): Promise<RouteDistanceResult> => {
  const response = await axiosInstance.post<RouteDistanceResponse>('/places/route-distance', {
    waypoints,
  });
  return response.data.data;
};
