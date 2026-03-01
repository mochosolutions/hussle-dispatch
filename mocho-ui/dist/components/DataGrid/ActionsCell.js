import { jsx, jsxs } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { IconButton, Tooltip, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditOutlinedIcon from "../../_virtual/EditOutlined.js";
import DeleteOutlinedIcon from "../../_virtual/DeleteOutlined.js";
import VisibilityOutlinedIcon from "../../_virtual/VisibilityOutlined.js";
const ActionsCell = ({
  data,
  config
}) => {
  const navigate = useNavigate();
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
    viewIcon = /* @__PURE__ */ jsx(VisibilityOutlinedIcon, { fontSize: "small" }),
    editIcon = /* @__PURE__ */ jsx(EditOutlinedIcon, { fontSize: "small" }),
    deleteIcon = /* @__PURE__ */ jsx(DeleteOutlinedIcon, { fontSize: "small" }),
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
  return /* @__PURE__ */ jsxs(Box, { sx: {
    display: "flex",
    height: "100%",
    alignItems: "center",
    gap: 0.5,
    p: 1
  }, children: [
    showView && getViewRoute && /* @__PURE__ */ jsx(Tooltip, { title: viewTooltip, arrow: true, children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { onClick: handleView, disabled: viewDisabled, size: "small", "aria-label": viewTooltip, children: viewIcon }) }) }),
    showEdit && getEditRoute && /* @__PURE__ */ jsx(Tooltip, { title: editTooltip, arrow: true, children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { onClick: handleEdit, disabled: editDisabled, size: "small", "aria-label": editTooltip, children: editIcon }) }) }),
    showDelete && onDelete && /* @__PURE__ */ jsx(Tooltip, { title: deleteTooltip, arrow: true, children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { onClick: handleDelete, disabled: deleteDisabled, size: "small", color: "error", "aria-label": deleteTooltip, children: deleteIcon }) }) }),
    onCustomAction && customActionIcon && /* @__PURE__ */ jsx(Tooltip, { title: customActionTooltip, arrow: true, children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { onClick: handleCustomAction, size: "small", "aria-label": customActionTooltip, children: customActionIcon }) }) })
  ] });
};
function createActionsCell(config) {
  const ConfiguredActionsCell = (props) => {
    return /* @__PURE__ */ jsx(ActionsCell, { ...props, config });
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
export {
  ActionsCell,
  createActionsCell,
  createStandardCrudActionsConfig
};
//# sourceMappingURL=ActionsCell.js.map
