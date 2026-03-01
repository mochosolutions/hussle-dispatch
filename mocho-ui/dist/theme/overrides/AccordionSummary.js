import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { RightOutlined } from "@ant-design/icons";
function AccordionSummary(theme) {
  const {
    palette,
    spacing
  } = theme;
  return {
    MuiAccordionSummary: {
      defaultProps: {
        expandIcon: /* @__PURE__ */ jsx(RightOutlined, { style: {
          fontSize: "0.75rem"
        } })
      },
      styleOverrides: {
        root: {
          backgroundColor: palette.secondary.lighter,
          minHeight: 46
        },
        expandIconWrapper: {
          "&.Mui-expanded": {
            transform: "rotate(90deg)"
          }
        },
        content: {
          marginTop: spacing(1.25),
          marginBottom: spacing(1.25),
          marginLeft: spacing(1)
        }
      }
    }
  };
}
export {
  AccordionSummary as default
};
//# sourceMappingURL=AccordionSummary.js.map
