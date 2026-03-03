var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import { Component } from "react";
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "resetErrorBoundary", () => {
      this.setState({
        hasError: false,
        error: null
      });
    });
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    const {
      onError,
      context
    } = this.props;
    if (onError) {
      onError(error, errorInfo);
    }
    if (process.env.NODE_ENV === "development") {
      console.error(`ErrorBoundary caught error${context ? ` in ${context}` : ""}:`, error, errorInfo);
    }
  }
  render() {
    const {
      hasError,
      error
    } = this.state;
    const {
      children,
      fallback,
      context
    } = this.props;
    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.resetErrorBoundary);
      }
      return /* @__PURE__ */ jsx(DefaultErrorFallback, { error, context, onReset: this.resetErrorBoundary });
    }
    return children;
  }
}
function DefaultErrorFallback({
  error,
  context,
  onReset
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
    minHeight: "400px"
  }, role: "alert", "aria-live": "assertive", children: [
    /* @__PURE__ */ jsx("div", { style: {
      fontSize: "3rem",
      marginBottom: "1rem"
    }, children: "⚠️" }),
    /* @__PURE__ */ jsx("h2", { style: {
      marginBottom: "0.5rem",
      fontSize: "1.5rem",
      fontWeight: 600
    }, children: context ? `Error in ${context}` : "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { style: {
      marginBottom: "1.5rem",
      color: "#666",
      maxWidth: "500px"
    }, children: "An unexpected error occurred. Please try refreshing the page or contact support if the problem persists." }),
    process.env.NODE_ENV === "development" && /* @__PURE__ */ jsxs("details", { style: {
      marginBottom: "1.5rem",
      textAlign: "left",
      maxWidth: "600px"
    }, children: [
      /* @__PURE__ */ jsx("summary", { style: {
        cursor: "pointer",
        marginBottom: "0.5rem",
        fontWeight: 500
      }, children: "Error Details (Development)" }),
      /* @__PURE__ */ jsxs("pre", { style: {
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        overflow: "auto",
        fontSize: "0.875rem"
      }, children: [
        error.message,
        "\n\n",
        error.stack
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: onReset, style: {
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      fontWeight: 500,
      color: "white",
      backgroundColor: "#1976d2",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.2s"
    }, onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = "#1565c0";
    }, onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = "#1976d2";
    }, children: "Try Again" })
  ] });
}
export {
  ErrorBoundary,
  ErrorBoundary as default
};
//# sourceMappingURL=ErrorBoundary.js.map
