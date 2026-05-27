import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import { colors, fontFamily } from '../shared/emailStyles';

interface EmailLayoutProps {
  preview: string;
  headerTitle: string;
  headerSubtitle?: string;
  children: ReactNode;
}

const EmailLayout = ({ preview, headerTitle, headerSubtitle, children }: EmailLayoutProps) => (
  <Html>
    <Head>
      <Font
        fontFamily="Plus Jakarta Sans"
        fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
        webFont={{
          url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerTitleStyle}>{headerTitle}</Text>
          {headerSubtitle ? <Text style={headerSubtitleStyle}>{headerSubtitle}</Text> : null}
        </Section>
        <Section style={content}>{children}</Section>
        <Section style={footer}>
          <Text style={footerText}>Sent via Hussle Dispatch</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default EmailLayout;

const body: React.CSSProperties = {
  backgroundColor: colors.grey100,
  fontFamily,
  margin: '0',
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: colors.white,
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  backgroundColor: colors.primaryDark,
  padding: '32px 40px',
};

const headerTitleStyle: React.CSSProperties = {
  color: colors.white,
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0',
};

const headerSubtitleStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '1.4',
  margin: '8px 0 0 0',
};

const content: React.CSSProperties = {
  padding: '32px 40px',
};

const footer: React.CSSProperties = {
  backgroundColor: colors.grey100,
  borderTop: `1px solid ${colors.grey200}`,
  padding: '20px 40px',
};

const footerText: React.CSSProperties = {
  color: colors.grey400,
  fontSize: '12px',
  margin: '0',
  textAlign: 'center' as const,
};
