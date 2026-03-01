import { jsx, Fragment } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import CircularProgress from "../../node_modules/@mui/material/CircularProgress/CircularProgress.js";
import styled from "../../node_modules/@mui/material/styles/styled.js";
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
