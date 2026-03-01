import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import LinearProgress from "../../node_modules/@mui/material/LinearProgress/LinearProgress.js";
import styled from "../../node_modules/@mui/material/styles/styled.js";
const LoaderWrapper = styled("div")(({
  theme
}) => ({
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 2001,
  width: "100%",
  "& > * + *": {
    marginTop: theme.spacing(2)
  }
}));
const Loader = () => /* @__PURE__ */ jsx(LoaderWrapper, { children: /* @__PURE__ */ jsx(LinearProgress, { color: "primary" }) });
export {
  Loader as default
};
//# sourceMappingURL=Loader.js.map
