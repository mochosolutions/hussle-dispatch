import { jsx, Fragment } from "@emotion/react/jsx-runtime";
const FormattedMessage = ({
  id,
  defaultMessage
}) => {
  return /* @__PURE__ */ jsx(Fragment, { children: defaultMessage || id });
};
export {
  FormattedMessage,
  FormattedMessage as default
};
//# sourceMappingURL=FormattedMessage.js.map
