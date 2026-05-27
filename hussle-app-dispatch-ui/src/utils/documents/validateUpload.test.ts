import {
  MAX_BYTES_BY_MIME,
  UploadValidationErrorType,
  validateUpload,
} from './validateUpload';

const makeFile = (name: string, type: string, size: number): File => {
  const file = new File(['x'], name, { type });
  // The File constructor sizes its blob from the array, so override .size for size-cap tests.
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('validateUpload', () => {
  describe('valid types', () => {
    it('accepts image/jpeg under the size limit', () => {
      const result = validateUpload(makeFile('photo.jpg', 'image/jpeg', 1024));
      expect(result).toEqual({ ok: true });
    });

    it('accepts image/png under the size limit', () => {
      const result = validateUpload(makeFile('photo.png', 'image/png', 1024));
      expect(result).toEqual({ ok: true });
    });

    it('accepts application/pdf under the size limit', () => {
      const result = validateUpload(makeFile('contract.pdf', 'application/pdf', 1024));
      expect(result).toEqual({ ok: true });
    });
  });

  describe('rejected types', () => {
    it('rejects image/gif with INVALID_FILE_TYPE', () => {
      const result = validateUpload(makeFile('animation.gif', 'image/gif', 1024));

      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.error.type).toBe(UploadValidationErrorType.INVALID_FILE_TYPE);
      expect(result.error.message).toMatch(/JPEG, PNG, or PDF/i);
    });
  });

  describe('per-MIME size caps', () => {
    it('rejects PDFs over 5 MB with FILE_TOO_LARGE', () => {
      const pdfMax = MAX_BYTES_BY_MIME['application/pdf'] ?? 0;
      const result = validateUpload(makeFile('big.pdf', 'application/pdf', pdfMax + 1));

      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.error.type).toBe(UploadValidationErrorType.FILE_TOO_LARGE);
      expect(result.error.message).toMatch(/5 MB/i);
    });

    it('accepts a PDF exactly at the 5 MB limit', () => {
      const pdfMax = MAX_BYTES_BY_MIME['application/pdf'] ?? 0;
      const result = validateUpload(makeFile('edge.pdf', 'application/pdf', pdfMax));
      expect(result).toEqual({ ok: true });
    });

    it('accepts a JPEG between 5 MB and 10 MB (PDF cap does not apply)', () => {
      const result = validateUpload(makeFile('photo.jpg', 'image/jpeg', 7 * 1024 * 1024));
      expect(result).toEqual({ ok: true });
    });

    it('rejects PNGs over 10 MB with FILE_TOO_LARGE', () => {
      const pngMax = MAX_BYTES_BY_MIME['image/png'] ?? 0;
      const result = validateUpload(makeFile('huge.png', 'image/png', pngMax + 1));

      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.error.type).toBe(UploadValidationErrorType.FILE_TOO_LARGE);
      expect(result.error.message).toMatch(/10 MB/i);
    });

    it('accepts a PNG exactly at the 10 MB limit', () => {
      const pngMax = MAX_BYTES_BY_MIME['image/png'] ?? 0;
      const result = validateUpload(makeFile('edge.png', 'image/png', pngMax));
      expect(result).toEqual({ ok: true });
    });
  });
});
