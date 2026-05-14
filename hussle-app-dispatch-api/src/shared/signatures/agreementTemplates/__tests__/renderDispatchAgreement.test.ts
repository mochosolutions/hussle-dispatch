import type { DispatchAgreementVariables } from '../dispatchAgreement';
import { renderDispatchAgreement } from '../renderDispatchAgreement';

const sampleVariables: DispatchAgreementVariables = {
  carrierLegalName: 'Acme Trucking LLC',
  carrierMcNumber: '123456',
  carrierDotNumber: '7890123',
  orgName: 'FleetCommand',
  effectiveDate: '2026-06-01',
};

describe('renderDispatchAgreement', () => {
  it('substitutes every variable into the rendered HTML', async () => {
    const html = await renderDispatchAgreement(sampleVariables);
    expect(html).toContain('Acme Trucking LLC');
    expect(html).toContain('123456');
    expect(html).toContain('7890123');
    expect(html).toContain('FleetCommand');
    expect(html).toContain('2026-06-01');
  });

  it('contains exactly one DocuSeal signer.signature anchor', async () => {
    const html = await renderDispatchAgreement(sampleVariables);
    const matches = html.match(/\{\{signer1\.signature\}\}/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('contains exactly one DocuSeal signer.date anchor', async () => {
    const html = await renderDispatchAgreement(sampleVariables);
    const matches = html.match(/\{\{signer1\.date\}\}/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('snapshot of rendered HTML is stable', async () => {
    const html = await renderDispatchAgreement(sampleVariables);
    expect(html).toMatchSnapshot();
  });
});
