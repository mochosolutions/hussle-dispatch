import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { useTheme, styled } from "@mui/material/styles";
import { Box, CardMedia, Container, Grid, Typography, Button, Link, Stack, Divider } from "@mui/material";
import { motion } from "framer-motion";
import { SendOutlined } from "@ant-design/icons";
import AnimateButton from "../../extended/AnimateButton.js";
import { ThemeMode, ThemeDirection } from "../../../types/config.js";
const imgfooterlogo = "";
const FooterLink = styled(Link)(({
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
const FooterBlock = ({
  isFull
}) => {
  const theme = useTheme();
  const textColor = theme.palette.mode === ThemeMode.DARK ? "text.primary" : "background.paper";
  ({
    color: theme.palette.common.white
  });
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isFull && /* @__PURE__ */ jsxs(Box, { sx: {
      position: "relative",
      bgcolor: theme.palette.grey.A700,
      zIndex: 1,
      mt: {
        xs: 0,
        md: 13.75
      },
      pt: {
        xs: 8,
        sm: 7.5,
        md: 18.75
      },
      pb: {
        xs: 2.5,
        md: 10
      },
      "&:after": {
        content: '""',
        position: "absolute",
        width: "100%",
        height: "80%",
        bottom: 0,
        left: 0,
        background: theme.direction === ThemeDirection.RTL ? `linear-gradient(transparent 100%, rgb(31, 31, 31) 70%)` : `linear-gradient(180deg, transparent 0%, ${theme.palette.grey.A700} 70%)`
      }
    }, children: [
      /* @__PURE__ */ jsx(
        CardMedia,
        {
          component: "img",
          sx: {
            display: {
              xs: "none",
              md: "block"
            },
            width: "55%",
            maxWidth: 700,
            position: "absolute",
            top: "-28%",
            right: 0,
            ...theme.direction === ThemeDirection.RTL && {
              transform: "scaleX(-1)",
              float: "none"
            }
          }
        }
      ),
      /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx(Grid, { container: true, alignItems: "center", justifyContent: "space-between", spacing: 2, children: /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, md: 6, sx: {
        position: "relative",
        zIndex: 1
      }, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, sx: {
        [theme.breakpoints.down("md")]: {
          pr: 0,
          textAlign: "center"
        }
      }, children: [
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", sx: {
          color: theme.palette.common.white
        }, children: "Roadmap" }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(motion.div, { initial: {
          opacity: 0,
          translateY: 550
        }, animate: {
          opacity: 1,
          translateY: 0
        }, transition: {
          type: "spring",
          stiffness: 150,
          damping: 30
        }, children: /* @__PURE__ */ jsx(Typography, { variant: "h2", sx: {
          color: theme.palette.common.white,
          fontWeight: 700
        }, children: "Upcoming Release" }) }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(Typography, { variant: "body1", sx: {
          color: theme.palette.common.white
        }, children: "What is next? Checkout the Upcoming release of Mantis React." }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, sx: {
          my: 2
        }, children: /* @__PURE__ */ jsx(Box, { sx: {
          display: "inline-block"
        }, children: /* @__PURE__ */ jsx(AnimateButton, { children: /* @__PURE__ */ jsx(Button, { size: "large", variant: "contained", endIcon: /* @__PURE__ */ jsx(SendOutlined, {}), component: Link, href: "https://codedthemes.gitbook.io/mantis/roadmap", target: "_blank", children: "Roadmap" }) }) }) })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsx(Box, { sx: {
      pt: isFull ? 0 : 10,
      pb: 10,
      bgcolor: theme.palette.grey.A700
    }, children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, md: 4, children: /* @__PURE__ */ jsx(motion.div, { initial: {
        opacity: 0,
        translateY: 550
      }, animate: {
        opacity: 1,
        translateY: 0
      }, transition: {
        type: "spring",
        stiffness: 150,
        damping: 30
      }, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(CardMedia, { component: "img", image: imgfooterlogo, sx: {
          width: "auto"
        } }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", sx: {
          fontWeight: 400,
          color: theme.palette.common.white
        }, children: "Since 2017, More than 50K+ Developers trust the CodedThemes Digital Product. Mantis React is Manage under their Experienced Team Players." }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, md: 8, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: {
        xs: 5,
        md: 2
      }, children: [
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Help" }),
          /* @__PURE__ */ jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsx(FooterLink, { href: "https://blog.mantisdashboard.io/", target: "_blank", underline: "none", children: "Blog" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", underline: "none", children: "Documentation" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "https://codedthemes.gitbook.io/mantis/changelog", target: "_blank", underline: "none", children: "Change Log" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "https://codedthemes.support-hub.io/", target: "_blank", underline: "none", children: "Support" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Store Help" }),
          /* @__PURE__ */ jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsx(FooterLink, { href: "#", target: "_blank", underline: "none", children: "License" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "#", target: "_blank", underline: "none", children: "Refund Policy" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "#", target: "_blank", underline: "none", children: "Submit a Request" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "Mantis Eco-System" }),
          /* @__PURE__ */ jsx(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: frameworks.map((item, index) => /* @__PURE__ */ jsx(FooterLink, { href: item.link, target: "_blank", underline: "none", children: item.title }, index)) })
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxs(Stack, { spacing: {
          xs: 3,
          md: 5
        }, children: [
          /* @__PURE__ */ jsx(Typography, { variant: "h5", color: textColor, sx: {
            fontWeight: 500
          }, children: "More Products" }),
          /* @__PURE__ */ jsxs(Stack, { spacing: {
            xs: 1.5,
            md: 2.5
          }, children: [
            /* @__PURE__ */ jsx(FooterLink, { href: "", target: "_blank", underline: "none", children: "Berry React Material" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "", target: "_blank", underline: "none", children: "Free Berry React" }),
            /* @__PURE__ */ jsx(FooterLink, { href: "", target: "_blank", underline: "none", children: "Free Mantis React" })
          ] })
        ] }) })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Divider, { sx: {
      borderColor: "grey.700"
    } }),
    /* @__PURE__ */ jsx(Box, { sx: {
      py: 1.5,
      bgcolor: theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[800]
    }, children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, children: [
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, sm: 8, children: /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", color: "secondary", children: "© Made with love by Team CodedThemes" }) }),
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, sm: 4 })
    ] }) }) })
  ] });
};
export {
  FooterBlock as default
};
//# sourceMappingURL=FooterBlock.js.map
