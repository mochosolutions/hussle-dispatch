import { renderToStaticMarkup } from 'react-dom/server';
import DispatchAgreement, { type DispatchAgreementVariables } from './dispatchAgreement';

const DOCTYPE = '<!DOCTYPE html>';

export const renderDispatchAgreement = async (
  variables: DispatchAgreementVariables,
): Promise<string> => `${DOCTYPE}${renderToStaticMarkup(DispatchAgreement(variables))}`;
