const MAX_BYTES = 2048;

export const truncateRawData = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...raw };

  Object.keys(copy).forEach((key) => {
    if (Array.isArray(copy[key])) {
      delete copy[key];
    }
  });

  const fits = (): boolean => Buffer.byteLength(JSON.stringify(copy), 'utf8') <= MAX_BYTES;

  while (!fits()) {
    const keys = Object.keys(copy);
    if (keys.length === 0) break;

    const firstKey = keys[0];
    if (firstKey === undefined) break;

    let largestKey: string = firstKey;
    let largestSize = Buffer.byteLength(JSON.stringify(copy[firstKey]), 'utf8');

    keys.slice(1).forEach((key) => {
      const size = Buffer.byteLength(JSON.stringify(copy[key]), 'utf8');
      if (size > largestSize) {
        largestSize = size;
        largestKey = key;
      }
    });

    delete copy[largestKey];
  }

  return copy;
};
