"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function validateImageBeforeUpload(file, maxSizeMB = 10) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      type: "INVALID_FILE_TYPE",
      message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      technicalDetails: `File type: ${file.type}`,
      retryable: false
    };
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      type: "FILE_TOO_LARGE",
      message: `Image file is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
      technicalDetails: `File size: ${file.size} bytes`,
      retryable: false
    };
  }
  return null;
}
exports.validateImageBeforeUpload = validateImageBeforeUpload;
//# sourceMappingURL=imageUploadErrors.cjs.map
