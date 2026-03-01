import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import SimpleBarReact from "simplebar-react";
import { Box } from "@mui/material";
/* empty css                                                        */
const SimpleBar = ({
  children,
  sx,
  ...props
}) => {
  return /* @__PURE__ */ jsx(Box, { component: SimpleBarReact, sx: {
    maxHeight: "100%",
    "& .simplebar-scrollbar::before": {
      backgroundColor: "grey.500"
    },
    "& .simplebar-track.simplebar-vertical": {
      width: 10
    },
    "& .simplebar-track.simplebar-horizontal": {
      height: 10
    },
    ...sx
  }, ...props, children });
};
export {
  SimpleBar as default
};
//# sourceMappingURL=SimpleBar.js.map
