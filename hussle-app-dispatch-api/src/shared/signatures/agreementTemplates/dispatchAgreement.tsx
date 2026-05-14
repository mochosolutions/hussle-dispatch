import { Body, Container, Head, Heading, Html, Text } from '@react-email/components';

export interface DispatchAgreementVariables {
  carrierLegalName: string;
  carrierMcNumber: string;
  carrierDotNumber: string;
  orgName: string;
  effectiveDate: string;
}

const bodyStyle = { fontFamily: 'Helvetica, Arial, sans-serif', color: '#222' } as const;

const DispatchAgreement = ({
  carrierLegalName,
  carrierMcNumber,
  carrierDotNumber,
  orgName,
  effectiveDate,
}: DispatchAgreementVariables) => (
  <Html>
    <Head />
    <Body style={bodyStyle}>
      <Container>
        <Heading as="h1">Dispatch Service Agreement</Heading>
        <Text>
          This Dispatch Service Agreement ("Agreement") is entered into on {effectiveDate}{' '}
          between {orgName} ("Broker") and {carrierLegalName} (MC# {carrierMcNumber}, DOT#{' '}
          {carrierDotNumber}) ("Carrier").
        </Text>
        <Text>
          Carrier agrees to dispatch services as described in Schedule A, attached and
          incorporated by reference.
        </Text>
        <Text>Carrier signature: {'{{signer1.signature}}'}</Text>
        <Text>Date: {'{{signer1.date}}'}</Text>
      </Container>
    </Body>
  </Html>
);

export default DispatchAgreement;
