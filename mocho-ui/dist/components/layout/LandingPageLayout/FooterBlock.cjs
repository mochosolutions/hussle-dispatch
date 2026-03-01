"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const framerMotion = require("framer-motion");
const useConfig = require("../../../hooks/useConfig.cjs");
const config = require("../../../config.cjs");
const FacebookFilled = require("../../../_virtual/FacebookFilled.cjs");
const InstagramFilled = require("../../../_virtual/InstagramFilled.cjs");
const LinkedinFilled = require("../../../_virtual/LinkedinFilled.cjs");
const TwitterOutlined = require("../../../_virtual/TwitterOutlined.cjs");
const useTheme = require("../../../node_modules/@mui/material/styles/useTheme.cjs");
const Container = require("../../../node_modules/@mui/material/Container/Container.cjs");
const Grid = require("../../../node_modules/@mui/material/Grid/Grid.cjs");
const CardMedia = require("../../../node_modules/@mui/material/CardMedia/CardMedia.cjs");
const Typography = require("../../../node_modules/@mui/material/Typography/Typography.cjs");
const Stack = require("../../../node_modules/@mui/material/Stack/Stack.cjs");
const styled = require("../../../node_modules/@mui/material/styles/styled.cjs");
const Box = require("../../../node_modules/@mui/material/Box/Box.cjs");
const Divider = require("../../../node_modules/@mui/material/Divider/Divider.cjs");
const Link = require("../../../node_modules/@mui/material/Link/Link.cjs");
const imgfooterlogo = "";
const FooterLink = styled.default(Link)(({
  theme
}) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.primary.main
  },
  "&:active": {
    color: theme.palette.primary.main
  }
}));
function FooterBlock({
  isFull
}) {
  useTheme();
  const {
    mode,
    presetColor
  } = useConfig.useConfig();
  const textColor = mode === config.ThemeMode.DARK ? "text.primary" : "background.paper";
  const linkSX = {
    color: "common.white",
    fontSize: "1.1rem",
    fontWeight: 400,
    opacity: "0.6",
    cursor: "pointer",
    "&:hover": {
      opacity: "1"
    }
  };
  const frameworks = [{
    title: "CodeIgniter",
    link: "https://codedthemes.com/item/mantis-codeigniter-admin-template/"
  }, {
    title: "React MUI",
    link: "https://mui.com/store/items/mantis-react-admin-dashboard-template/"
  }, {
    title: "Angular",
    link: "https://codedthemes.com/item/mantis-angular-admin-template/"
  }, {
    title: "Bootstrap 5",
    link: "https://codedthemes.com/item/mantis-bootstrap-admin-dashboard/"
  }, {
    title: ".Net",
    link: "https://codedthemes.com/item/mantis-dotnet-bootstrap-dashboard-template/"
  }];
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Box, { sx: {
      pt: isFull ? 0 : 10,
      pb: 10,
      bgcolor: "grey.A700"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Container, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Grid.default, { container: true, spacing: 2, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(framerMotion.motion.div, { initial: {
        opacity: 0,
        translateY: 550
      }, animate: {
        opacity: 1,
        translateY: 0
      }, transition: {
        type: "spring",
        stiffness: 150,
        damping: 30
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Grid.default, { container: true, spacing: 2, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(CardMedia, { component: "img", image: imgfooterlogo, sx: {
          width: "auto"
        } }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "subtitle1", sx: {
          fontWeight: 400,
          color: "common.white"
        }, children: "Since 2017, More than 50K+ Developers trust the CodedThemes Digital Product. Mantis React is Manage under their Experienced Team Players." }) })
      ] }) }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, md: 8, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Grid.default, { container: true, spacing: {
        xs: 5,
        md: 2
      }, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Help" }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://blog.mantisdashboard.io/", target: "_blank", underline: "none", children: "Blog" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", underline: "none", children: "Documentation" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/changelog", target: "_blank", underline: "none", children: "Change Log" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://codedthemes.support-hub.io/", target: "_blank", underline: "none", children: "Support" })
          ] })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Store Help" }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://mui.com/store/license/", target: "_blank", underline: "none", children: "License" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://mui.com/store/customer-refund-policy/", target: "_blank", underline: "none", children: "Refund Policy" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://support.mui.com/hc/en-us/sections/360002564979-For-customers", target: "_blank", underline: "none", children: "Submit a Request" })
          ] })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Mantis Eco-System" }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: frameworks.map((item, index) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: item.link, target: "_blank", underline: "none", children: item.title }, index)) })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "More Products" }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "http://mui.com/store/previews/berry-react-material-admin/", target: "_blank", underline: "none", children: "Berry React Material" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://mui.com/store/previews/berry-react-material-admin-free/", target: "_blank", underline: "none", children: "Free Berry React" }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterLink, { href: "https://github.com/codedthemes/mantis-free-react-admin-template", target: "_blank", underline: "none", children: "Free Mantis React" })
          ] })
        ] }) })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Divider, { sx: {
      borderColor: "grey.700"
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Box, { sx: {
      py: 1.5,
      bgcolor: "grey.800"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Container, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Grid.default, { container: true, spacing: 2, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, sm: 8, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "subtitle2", color: "secondary", children: "© Made with love by Team CodedThemes" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, xs: 12, sm: 4, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Grid.default, { container: true, spacing: 2, alignItems: "center", sx: {
        justifyContent: "flex-end"
      }, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Link, { href: "https://www.instagram.com/codedthemes", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(InstagramFilled, {}) }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Link, { href: "https://twitter.com/codedthemes/status/1768163845858603500", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(TwitterOutlined, {}) }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Link, { href: "https://in.linkedin.com/company/codedthemes", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LinkedinFilled, {}) }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Grid.default, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Link, { href: "https://www.facebook.com/codedthemes/", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FacebookFilled, {}) }) })
      ] }) })
    ] }) }) })
  ] });
}
module.exports = FooterBlock;
//# sourceMappingURL=FooterBlock.cjs.map
