import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import { Box, Alert, AlertTitle, Typography, Button } from "@mui/material";
import { Refresh, ArrowBack, ErrorOutline } from "@mui/icons-material";
function ErrorState({
  message,
  error,
  severity = "error",
  title,
  onRetry,
  onGoBack,
  retryText = "Retry",
  goBackText = "Go Back",
  hideRetry = false,
  hideGoBack = false,
  minHeight = 300,
  showDetails = process.env.NODE_ENV === "development"
}) {
  const errorMessage = typeof error === "string" ? error : error?.message;
  const displayMessage = message || errorMessage || "An unexpected error occurred";
  const displayTitle = title || getDefaultTitle(severity);
  return /* @__PURE__ */ jsx(Box, { sx: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight,
    padding: 3,
    textAlign: "center"
  }, role: "alert", "aria-live": "assertive", children: /* @__PURE__ */ jsxs(Alert, { severity, icon: /* @__PURE__ */ jsx(ErrorOutline, { fontSize: "large" }), sx: {
    width: "100%",
    maxWidth: 600,
    "& .MuiAlert-message": {
      width: "100%"
    }
  }, children: [
    /* @__PURE__ */ jsx(AlertTitle, { sx: {
      fontSize: "1.25rem",
      fontWeight: 600
    }, children: displayTitle }),
    /* @__PURE__ */ jsx(Typography, { variant: "body1", sx: {
      mb: 2
    }, children: displayMessage }),
    showDetails && error && typeof error !== "string" && /* @__PURE__ */ jsxs("details", { style: {
      marginTop: "1rem",
      textAlign: "left"
    }, children: [
      /* @__PURE__ */ jsx("summary", { style: {
        cursor: "pointer",
        marginBottom: "0.5rem",
        fontWeight: 500
      }, children: "Error Details (Development)" }),
      /* @__PURE__ */ jsxs(Box, { component: "pre", sx: {
        padding: 2,
        backgroundColor: "grey.100",
        borderRadius: 1,
        overflow: "auto",
        fontSize: "0.875rem",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }, children: [
        error.message,
        "\n\n",
        error.stack
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Box, { sx: {
      mt: 2,
      display: "flex",
      gap: 2,
      justifyContent: "center",
      flexWrap: "wrap"
    }, children: [
      !hideRetry && onRetry && /* @__PURE__ */ jsx(Button, { variant: "contained", color: severity === "error" ? "error" : "primary", startIcon: /* @__PURE__ */ jsx(Refresh, {}), onClick: onRetry, "aria-label": retryText, children: retryText }),
      !hideGoBack && onGoBack && /* @__PURE__ */ jsx(Button, { variant: "outlined", color: "inherit", startIcon: /* @__PURE__ */ jsx(ArrowBack, {}), onClick: onGoBack, "aria-label": goBackText, children: goBackText })
    ] })
  ] }) });
}
function getDefaultTitle(severity) {
  switch (severity) {
    case "error":
      return "Error Occurred";
    case "warning":
      return "Warning";
    case "info":
      return "Information";
    default:
      return "Error Occurred";
  }
}
export {
  ErrorState,
  ErrorState as default
};
//# sourceMappingURL=ErrorState.js.map
