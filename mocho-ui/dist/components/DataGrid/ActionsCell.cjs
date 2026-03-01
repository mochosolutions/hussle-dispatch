"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const reactRouterDom = require("react-router-dom");
const EditOutlined = require("../../_virtual/EditOutlined.cjs");
const DeleteOutlined = require("../../_virtual/DeleteOutlined.cjs");
const VisibilityOutlined = require("../../_virtual/VisibilityOutlined.cjs");
const ActionsCell = ({
  data,
  config
}) => {
  const navigate = reactRouterDom.useNavigate();
  const {
    getViewRoute,
    getEditRoute,
    onDelete,
    onCustomAction,
    customActionIcon,
    customActionTooltip = "Action",
    showView = false,
    showEdit = true,
    showDelete = true,
    viewIcon = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(VisibilityOutlined, { fontSize: "small" }),
    editIcon = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(EditOutlined, { fontSize: "small" }),
    deleteIcon = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(DeleteOutlined, { fontSize: "small" }),
    viewTooltip = "View",
    editTooltip = "Edit",
    deleteTooltip = "Delete",
    isEditDisabled,
    isDeleteDisabled,
    isViewDisabled,
    isExternalView = false
  } = config;
  const handleView = () => {
    if (getViewRoute && data) {
      const route = getViewRoute(data);
      if (isExternalView) {
        window.open(route, "_blank", "noopener,noreferrer");
      } else {
        navigate(route);
      }
    }
  };
  const handleEdit = () => {
    if (getEditRoute && data) {
      const route = getEditRoute(data);
      navigate(route);
    }
  };
  const handleDelete = () => {
    if (onDelete && data) {
      onDelete(data);
    }
  };
  const handleCustomAction = () => {
    if (onCustomAction && data) {
      onCustomAction(data);
    }
  };
  const editDisabled = isEditDisabled ? isEditDisabled(data) : false;
  const deleteDisabled = isDeleteDisabled ? isDeleteDisabled(data) : false;
  const viewDisabled = isViewDisabled ? isViewDisabled(data) : false;
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    display: "flex",
    height: "100%",
    alignItems: "center",
    gap: 0.5,
    p: 1
  }, children: [
    showView && getViewRoute && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: viewTooltip, arrow: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { onClick: handleView, disabled: viewDisabled, size: "small", "aria-label": viewTooltip, children: viewIcon }) }) }),
    showEdit && getEditRoute && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: editTooltip, arrow: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { onClick: handleEdit, disabled: editDisabled, size: "small", "aria-label": editTooltip, children: editIcon }) }) }),
    showDelete && onDelete && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: deleteTooltip, arrow: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { onClick: handleDelete, disabled: deleteDisabled, size: "small", color: "error", "aria-label": deleteTooltip, children: deleteIcon }) }) }),
    onCustomAction && customActionIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: customActionTooltip, arrow: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { onClick: handleCustomAction, size: "small", "aria-label": customActionTooltip, children: customActionIcon }) }) })
  ] });
};
function createActionsCell(config) {
  const ConfiguredActionsCell = (props) => {
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ActionsCell, { ...props, config });
  };
  ConfiguredActionsCell.displayName = "ConfiguredActionsCell";
  return ConfiguredActionsCell;
}
function createStandardCrudActionsConfig(config) {
  const {
    basePath,
    viewOptions = {},
    editOptions = {},
    deleteOptions = {}
  } = config;
  const showView = viewOptions.show ?? false;
  const isExternalView = viewOptions.isExternal ?? false;
  const getViewRoute = showView ? viewOptions.getRoute ?? ((data) => `${basePath}/${data.id}`) : void 0;
  const showEdit = editOptions.show ?? true;
  const getEditRoute = showEdit ? editOptions.getRoute ?? ((data) => `${basePath}/edit/${data.id}`) : void 0;
  const showDelete = deleteOptions.show ?? true;
  const onDelete = showDelete ? deleteOptions.onDelete : void 0;
  return {
    getViewRoute,
    getEditRoute,
    onDelete,
    showView,
    showEdit,
    showDelete,
    isExternalView
  };
}
exports.ActionsCell = ActionsCell;
exports.createActionsCell = createActionsCell;
exports.createStandardCrudActionsConfig = createStandardCrudActionsConfig;
//# sourceMappingURL=ActionsCell.cjs.map
