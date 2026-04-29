import { Link, Text } from '@react-email/components';
import type { ReactNode } from 'react';
import { colors } from './emailStyles';

interface CtaButtonProps {
  href: string;
  children: ReactNode;
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: colors.primary,
  borderRadius: '6px',
  color: colors.white,
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 24px',
  textDecoration: 'none',
};

const wrapper: React.CSSProperties = {
  margin: '24px 0 0 0',
  textAlign: 'center' as const,
};

const CtaButton = ({ href, children }: CtaButtonProps) => (
  <Text style={wrapper}>
    <Link href={href} style={buttonStyle}>
      {children}
    </Link>
  </Text>
);

export default CtaButton;
