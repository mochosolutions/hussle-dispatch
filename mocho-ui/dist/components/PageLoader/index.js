import { jsx, Fragment } from "@emotion/react/jsx-runtime";
import { styled } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
const LoaderWrapper = styled("div")(({
  theme
}) => ({
  zIndex: 2001,
  width: "100%",
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& > * + *": {
    marginTop: theme.spacing(2)
  }
}));
const PageLoader = ({
  open,
  children
}) => {
  if (open) {
    return /* @__PURE__ */ jsx(LoaderWrapper, { children: /* @__PURE__ */ jsx(CircularProgress, { color: "primary" }) });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
};
export {
  PageLoader,
  PageLoader as default
};
//# sourceMappingURL=index.js.map
