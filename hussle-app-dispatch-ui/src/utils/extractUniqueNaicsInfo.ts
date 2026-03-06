function extractUniqueNaicsInfo(notices: any[]): any[] {
  const uniqueNaicsMap = new Map<string, any>();

  notices.forEach((notice) => {
    const naicsCode = notice?.naicsStats?.naicsCode ?? 'Not Defined';
    const description = notice?.naicsStats?.description ?? '';

    if (uniqueNaicsMap.has(naicsCode)) {
      // If the naicsCode already exists, increment the occurrences count
      const existingEntry = uniqueNaicsMap.get(naicsCode)!;
      existingEntry.occurrences += 1;
    } else {
      // If it's a new naicsCode, add it with an initial occurrences count of 1
      uniqueNaicsMap.set(naicsCode, {naicsCode, description, occurrences: 1});
    }
  });

  return Array.from(uniqueNaicsMap.values());
}

export const extractPop = (notices: any[]): any[] => {
  const uniqueStateMap = new Map<string, any>();

  notices.forEach((notice) => {
    const stateCode = notice?.placeOfPerformance?.stateCode ?? 'Not Defined';

    if (uniqueStateMap.has(stateCode)) {
      // If the naicsCode already exists, increment the occurrences count
      const existingEntry = uniqueStateMap.get(stateCode)!;
      existingEntry.occurrences += 1;
    } else {
      // If it's a new naicsCode, add it with an initial occurrences count of 1
      uniqueStateMap.set(stateCode, {stateCode, occurrences: 1});
    }
  });

  return Array.from(uniqueStateMap.values());
};

export default extractUniqueNaicsInfo;
