import WelcomeEmail from '../src/welcome/WelcomeEmail';
import type { WelcomeEmailData } from '../src/welcome/renderWelcomeEmail';

WelcomeEmail.PreviewProps = {
  firstName: 'Marcus',
  orgName: 'Summit Transport LLC',
  orgRole: 'CARRIER',
  dashboardUrl: 'https://app.hussle.com/dashboard',
} satisfies WelcomeEmailData;

export default WelcomeEmail;
