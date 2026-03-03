"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const Box = require("@mui/material/Box");
const Container = require("@mui/material/Container");
const CardMedia = require("@mui/material/CardMedia");
const Divider = require("@mui/material/Divider");
const Grid = require("@mui/material/Grid");
const Link = require("@mui/material/Link");
const Stack = require("@mui/material/Stack");
const Typography = require("@mui/material/Typography");
const framerMotion = require("framer-motion");
const useConfig = require("../../../hooks/useConfig.cjs");
const config = require("../../../config.cjs");
const FacebookFilled = require("@ant-design/icons/FacebookFilled");
const InstagramFilled = require("@ant-design/icons/InstagramFilled");
const LinkedinFilled = require("@ant-design/icons/LinkedinFilled");
const TwitterOutlined = require("@ant-design/icons/TwitterOutlined");
const imgfooterlogo = "";
const FooterLink = styles.styled(Link)(({
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
  styles.useTheme();
  const {
    mode,
    presetColor
  } = useConfig();
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
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(Box, { sx: {
      pt: isFull ? 0 : 10,
      pb: 10,
      bgcolor: "grey.A700"
    }, children: /* @__PURE__ */ jsxRuntime.jsx(Container, { children: /* @__PURE__ */ jsxRuntime.jsxs(Grid, { container: true, spacing: 2, children: [
      /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsxRuntime.jsx(framerMotion.motion.div, { initial: {
        opacity: 0,
        translateY: 550
      }, animate: {
        opacity: 1,
        translateY: 0
      }, transition: {
        type: "spring",
        stiffness: 150,
        damping: 30
      }, children: /* @__PURE__ */ jsxRuntime.jsxs(Grid, { container: true, spacing: 2, children: [
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntime.jsx(CardMedia, { component: "img", image: imgfooterlogo, sx: {
          width: "auto"
        } }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "subtitle1", sx: {
          fontWeight: 400,
          color: "common.white"
        }, children: "Since 2017, More than 50K+ Developers trust the CodedThemes Digital Product. Mantis React is Manage under their Experienced Team Players." }) })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, md: 8, children: /* @__PURE__ */ jsxRuntime.jsxs(Grid, { container: true, spacing: {
        xs: 5,
        md: 2
      }, children: [
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Help" }),
          /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://blog.mantisdashboard.io/", target: "_blank", underline: "none", children: "Blog" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", underline: "none", children: "Documentation" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/changelog", target: "_blank", underline: "none", children: "Change Log" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://codedthemes.support-hub.io/", target: "_blank", underline: "none", children: "Support" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Store Help" }),
          /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://mui.com/store/license/", target: "_blank", underline: "none", children: "License" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://mui.com/store/customer-refund-policy/", target: "_blank", underline: "none", children: "Refund Policy" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://support.mui.com/hc/en-us/sections/360002564979-For-customers", target: "_blank", underline: "none", children: "Submit a Request" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Mantis Eco-System" }),
          /* @__PURE__ */ jsxRuntime.jsx(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: frameworks.map((item, index) => /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: item.link, target: "_blank", underline: "none", children: item.title }, index)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "More Products" }),
          /* @__PURE__ */ jsxRuntime.jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "http://mui.com/store/previews/berry-react-material-admin/", target: "_blank", underline: "none", children: "Berry React Material" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://mui.com/store/previews/berry-react-material-admin-free/", target: "_blank", underline: "none", children: "Free Berry React" }),
            /* @__PURE__ */ jsxRuntime.jsx(FooterLink, { href: "https://github.com/codedthemes/mantis-free-react-admin-template", target: "_blank", underline: "none", children: "Free Mantis React" })
          ] })
        ] }) })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx(Divider, { sx: {
      borderColor: "grey.700"
    } }),
    /* @__PURE__ */ jsxRuntime.jsx(Box, { sx: {
      py: 1.5,
      bgcolor: "grey.800"
    }, children: /* @__PURE__ */ jsxRuntime.jsx(Container, { children: /* @__PURE__ */ jsxRuntime.jsxs(Grid, { container: true, spacing: 2, children: [
      /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, sm: 8, children: /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "subtitle2", color: "secondary", children: "© Made with love by Team CodedThemes" }) }),
      /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, xs: 12, sm: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(Grid, { container: true, spacing: 2, alignItems: "center", sx: {
        justifyContent: "flex-end"
      }, children: [
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(Link, { href: "https://www.instagram.com/codedthemes", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ jsxRuntime.jsx(InstagramFilled, {}) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(Link, { href: "https://twitter.com/codedthemes/status/1768163845858603500", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ jsxRuntime.jsx(TwitterOutlined, {}) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(Link, { href: "https://in.linkedin.com/company/codedthemes", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ jsxRuntime.jsx(LinkedinFilled, {}) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(Link, { href: "https://www.facebook.com/codedthemes/", underline: "none", target: "_blank", sx: linkSX, children: /* @__PURE__ */ jsxRuntime.jsx(FacebookFilled, {}) }) })
      ] }) })
    ] }) }) })
  ] });
}
module.exports = FooterBlock;
//# sourceMappingURL=FooterBlock.cjs.map
