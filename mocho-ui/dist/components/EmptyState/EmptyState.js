import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { Box, Typography, Button } from "@mui/material";
import { Add, Inbox, HourglassEmpty, ErrorOutline, SearchOff } from "@mui/icons-material";
function EmptyState({
  icon,
  title,
  message,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  minHeight = 300,
  variant = "custom",
  entityName,
  compact = false
}) {
  const variantConfig = getVariantConfig(variant, entityName);
  const displayIcon = icon !== void 0 ? icon : variantConfig.icon;
  const displayTitle = title || variantConfig.title;
  const displayMessage = message || variantConfig.message;
  const displayActionText = actionText || variantConfig.actionText;
  const displaySecondaryActionText = secondaryActionText || variantConfig.secondaryActionText;
  const iconElement = typeof displayIcon === "string" ? /* @__PURE__ */ jsx(Typography, { variant: "h1", sx: {
    fontSize: compact ? "3rem" : "4rem",
    mb: 2
  }, children: displayIcon }) : /* @__PURE__ */ jsx(Box, { sx: {
    color: "text.secondary",
    mb: 2,
    "& .MuiSvgIcon-root": {
      fontSize: compact ? "3rem" : "4rem"
    }
  }, children: displayIcon });
  return /* @__PURE__ */ jsxs(Box, { sx: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight,
    padding: compact ? 2 : 3,
    textAlign: "center"
  }, role: "status", "aria-live": "polite", children: [
    displayIcon && iconElement,
    displayTitle && /* @__PURE__ */ jsx(Typography, { variant: compact ? "h6" : "h5", sx: {
      fontWeight: 600,
      mb: 1,
      color: "text.primary"
    }, children: displayTitle }),
    displayMessage && /* @__PURE__ */ jsx(Typography, { variant: "body1", sx: {
      color: "text.secondary",
      maxWidth: 500,
      mb: 3
    }, children: displayMessage }),
    /* @__PURE__ */ jsxs(Box, { sx: {
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      justifyContent: "center"
    }, children: [
      displayActionText && onAction && /* @__PURE__ */ jsx(Button, { variant: "contained", color: "primary", onClick: onAction, startIcon: variant === "no-data" ? /* @__PURE__ */ jsx(Add, {}) : void 0, size: compact ? "medium" : "large", children: displayActionText }),
      displaySecondaryActionText && onSecondaryAction && /* @__PURE__ */ jsx(Button, { variant: "outlined", color: "inherit", onClick: onSecondaryAction, size: compact ? "medium" : "large", children: displaySecondaryActionText })
    ] })
  ] });
}
function getVariantConfig(variant, entityName) {
  const entity = entityName || "Items";
  const entityLower = entity.toLowerCase();
  switch (variant) {
    case "no-data":
      return {
        icon: /* @__PURE__ */ jsx(Inbox, {}),
        title: `No ${entity} Yet`,
        message: `Get started by creating your first ${entityLower.replace(/s$/, "")}.`,
        actionText: `Create ${entity.replace(/s$/, "")}`,
        secondaryActionText: void 0
      };
    case "no-results":
      return {
        icon: /* @__PURE__ */ jsx(SearchOff, {}),
        title: "No Results Found",
        message: `No ${entityLower} match your current filters. Try adjusting your search or clearing filters.`,
        actionText: "Clear Filters",
        secondaryActionText: void 0
      };
    case "error":
      return {
        icon: /* @__PURE__ */ jsx(ErrorOutline, {}),
        title: "Unable to Load Data",
        message: "An error occurred while loading the data. Please try again.",
        actionText: "Retry",
        secondaryActionText: "Go Back"
      };
    case "loading":
      return {
        icon: /* @__PURE__ */ jsx(HourglassEmpty, {}),
        title: "Loading...",
        message: "Please wait while we load the data.",
        actionText: void 0,
        secondaryActionText: void 0
      };
    case "custom":
    default:
      return {
        icon: /* @__PURE__ */ jsx(Inbox, {}),
        title: "No Data",
        message: void 0,
        actionText: void 0,
        secondaryActionText: void 0
      };
  }
}
export {
  EmptyState,
  EmptyState as default
};
//# sourceMappingURL=EmptyState.js.map
