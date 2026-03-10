import axiosInstance from 'utils/axios';
import type {
  Place,
  PlaceListItem,
  CreatePlaceInput,
  UpdatePlaceInput,
  PaginationMeta,
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

export const getPlace = async (id: string): Promise<{ place: Place }> => {
  const response = await axiosInstance.get<GetPlaceResponse>(`/places/${id}`);
  return { place: response.data.data };
};

export const createPlace = async (data: CreatePlaceInput): Promise<{ place: Place }> => {
  const response = await axiosInstance.post<GetPlaceResponse>('/places', data);
  return { place: response.data.data };
};

export const updatePlace = async (
  id: string,
  data: UpdatePlaceInput,
): Promise<{ place: Place }> => {
  const response = await axiosInstance.patch<GetPlaceResponse>(`/places/${id}`, data);
  return { place: response.data.data };
};

export const deletePlace = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/places/${id}`);
};

export const typeaheadPlaces = async (
  query: string,
  limit = 10,
): Promise<{ places: PlaceListItem[] }> => {
  const response = await axiosInstance.get<TypeaheadPlacesResponse>('/places/typeahead', {
    params: { query, limit },
  });
  return { places: response.data.data };
};
