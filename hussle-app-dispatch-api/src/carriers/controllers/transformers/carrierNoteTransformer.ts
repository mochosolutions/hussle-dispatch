import type { CarrierNoteResponse } from '../../types/carrierTypes';

export interface CarrierNoteApiResponse {
  id: string;
  carrierId: string;
  text: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
}

export const toCarrierNoteResponse = (note: CarrierNoteResponse): CarrierNoteApiResponse => ({
  id: note.id,
  carrierId: note.carrierId,
  text: note.text,
  authorId: note.authorId,
  authorName: note.authorName,
  createdAt: note.createdAt.toISOString(),
});

export const toCarrierNoteListResponse = (
  notes: CarrierNoteResponse[],
): CarrierNoteApiResponse[] => notes.map(toCarrierNoteResponse);
