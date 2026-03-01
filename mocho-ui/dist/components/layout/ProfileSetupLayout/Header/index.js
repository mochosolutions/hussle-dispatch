import { jsx } from "../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Container, Box, Typography } from "@mui/material";
import { Logo } from "../../../Logo/index.js";
const Header = () => /* @__PURE__ */ jsx("div", { className: "header", style: {
  gridArea: "header",
  height: "80px"
}, children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx(Box, { sx: {
  width: "100%",
  // height: '80px',
  alignItems: "center",
  justifyContent: "space-between"
  // display: { xs: 'flex', md: 'none' },
  // borderBottom: "1px solid rgba(34,38,63,.149)",
}, children: /* @__PURE__ */ jsx(Typography, { sx: {
  textAlign: "left",
  display: "inline-block"
}, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }) }) }) });
export {
  Header as default
};
//# sourceMappingURL=index.js.map
