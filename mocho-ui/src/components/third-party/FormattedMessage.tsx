import React from 'react';

export interface FormattedMessageProps {
  /** Message ID to display */
  id: string;
  /** Default message if id not found */
  defaultMessage?: string;
  /** Values for interpolation */
  values?: Record<string, React.ReactNode>;
}

/**
 * FormattedMessage - Simple fallback for react-intl's FormattedMessage
 *
 * This renders the message ID as text. Applications that need full i18n
 * can wrap components with their own IntlProvider from react-intl.
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  id,
  defaultMessage,
}) => {
  return <>{defaultMessage || id}</>;
};

export default FormattedMessage;
