const getShadow = (theme, shadow) => {
  const shadows = theme.customShadows;
  if (!shadows) return theme.shadows[1];
  switch (shadow) {
    case "secondary":
      return shadows.secondary;
    case "error":
      return shadows.error;
    case "warning":
      return shadows.warning;
    case "info":
      return shadows.info;
    case "success":
      return shadows.success;
    case "primaryButton":
      return shadows.primaryButton;
    case "secondaryButton":
      return shadows.secondaryButton;
    case "errorButton":
      return shadows.errorButton;
    case "warningButton":
      return shadows.warningButton;
    case "infoButton":
      return shadows.infoButton;
    case "successButton":
      return shadows.successButton;
    default:
      return shadows.primary;
  }
};
export {
  getShadow as default
};
//# sourceMappingURL=getShadow.js.map
