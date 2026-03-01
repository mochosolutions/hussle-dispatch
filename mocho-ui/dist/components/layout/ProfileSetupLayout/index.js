import { jsxs, jsx } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Outlet } from "react-router-dom";
import { Container, Box } from "@mui/material";
import Header from "./Header/index.js";
import Footer from "./Footer/index.js";
import styled from "styled-components";
const MainLayoutContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'sidebar header header'
    'sidebar main main'
    'sidebar footer footer';
  overflow: auto;

  .header {
    grid-area: header;
  }

  .sidebar {
    grid-area: sidebar;
    border: 1px solid black;
  }

  .main {
    grid-area: main;
    display: flex;
  }

  .footer {
    grid-area: footer;
    min-height: 40px;
    padding: 1rem 0;
  }
`;
const ProfileSetupLayout = () => /* @__PURE__ */ jsxs(MainLayoutContainer, { children: [
  /* @__PURE__ */ jsx(Header, {}),
  /* @__PURE__ */ jsx(Box, { component: "main", className: "main", sx: {
    width: "100%",
    overflow: "hidden",
    flexGrow: 1,
    p: {
      xs: 2,
      sm: 3
    }
  }, children: /* @__PURE__ */ jsx(Container, { sx: {
    position: "relative",
    display: "flex",
    flexDirection: "column"
    // justifyContent: "flex-end",
  }, children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
  /* @__PURE__ */ jsx(Footer, {})
] });
export {
  MainLayoutContainer,
  ProfileSetupLayout as default
};
//# sourceMappingURL=index.js.map
