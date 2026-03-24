import CheckCallEmail from '../src/checkCall/CheckCallEmail';
import type { CheckCallEmailData } from '../src/checkCall/renderCheckCallEmail';

CheckCallEmail.PreviewProps = {
  loadNumber: 'LD-1087',
  location: 'Memphis, TN',
  status: 'In Transit',
  eta: 'March 23, 2026 — 2:00 PM CST',
  trackingUrl: 'https://track.example.com/LD-1087',
} satisfies CheckCallEmailData;

export default CheckCallEmail;
