interface LanePreferencesResponse {
  saved: boolean;
}

export const lanePreferencesTransformer = (result: { saved: boolean }): LanePreferencesResponse => ({
  saved: result.saved,
});
