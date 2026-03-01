"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const React = require("react");
function useDocumentUpload(options) {
  const {
    category,
    onComplete,
    onError,
    apiBaseUrl = "",
    pollingInterval = 1e3,
    maxPollingAttempts = 30
  } = options;
  const [state, setState] = React.useState("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const abortControllerRef = React.useRef(null);
  const pollingTimeoutRef = React.useRef(null);
  const clearPolling = React.useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);
  const reset = React.useCallback(() => {
    clearPolling();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState("idle");
    setProgress(0);
    setError(null);
    setResult(null);
  }, [clearPolling]);
  const cancel = React.useCallback(async () => {
    clearPolling();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState("idle");
    setProgress(0);
    setError(null);
  }, [clearPolling]);
  const pollStatus = React.useCallback(async (documentId, file, attempt = 0) => {
    if (attempt >= maxPollingAttempts) {
      const errorMsg = "Processing timeout - please try again";
      setError(errorMsg);
      setState("error");
      onError?.(errorMsg);
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/documents/${documentId}/status`, {
        signal: abortControllerRef.current?.signal
      });
      if (!response.ok) {
        throw new Error("Failed to check processing status");
      }
      const data = await response.json();
      if (data.status === "complete" && data.variants) {
        const uploadResult = {
          documentId,
          variants: data.variants,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        };
        setResult(uploadResult);
        setState("complete");
        onComplete?.(uploadResult);
      } else if (data.status === "error") {
        const errorMsg = data.error || "Processing failed";
        setError(errorMsg);
        setState("error");
        onError?.(errorMsg);
      } else {
        pollingTimeoutRef.current = setTimeout(() => {
          pollStatus(documentId, file, attempt + 1);
        }, pollingInterval);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      const errorMsg = "Failed to check processing status";
      setError(errorMsg);
      setState("error");
      onError?.(errorMsg);
    }
  }, [apiBaseUrl, maxPollingAttempts, pollingInterval, onComplete, onError]);
  const upload = React.useCallback(async (file) => {
    reset();
    abortControllerRef.current = new AbortController();
    try {
      setState("requesting");
      setProgress(0);
      const presignedResponse = await fetch(`${apiBaseUrl}/api/documents/presigned-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          category
        }),
        signal: abortControllerRef.current.signal
      });
      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }
      const {
        uploadUrl,
        documentId,
        fields
      } = await presignedResponse.json();
      setState("uploading");
      const xhr = new XMLHttpRequest();
      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(event.loaded / event.total * 100);
            setProgress(percentComplete);
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });
        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });
        if (fields) {
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("file", file);
          xhr.open("POST", uploadUrl, true);
          xhr.send(formData);
        } else {
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        }
      });
      setState("processing");
      setProgress(100);
      await pollStatus(documentId, file);
    } catch (err) {
      if (err.name === "AbortError" || err.message === "Upload cancelled") {
        setState("idle");
        return;
      }
      const errorMsg = err.message || "Upload failed";
      setError(errorMsg);
      setState("error");
      onError?.(errorMsg);
    }
  }, [apiBaseUrl, category, pollStatus, reset, onError]);
  return {
    state,
    progress,
    error,
    result,
    upload,
    cancel,
    reset
  };
}
exports.default = useDocumentUpload;
exports.useDocumentUpload = useDocumentUpload;
//# sourceMappingURL=useDocumentUpload.cjs.map
