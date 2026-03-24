import StatusChangeEmail from '../src/statusChange/StatusChangeEmail';
import type { StatusChangeEmailData } from '../src/statusChange/renderStatusChangeEmail';

StatusChangeEmail.PreviewProps = {
  loadNumber: 'LD-1087',
  fromStatus: 'In Transit',
  toStatus: 'Delivered',
  trackingUrl: 'https://track.example.com/LD-1087',
} satisfies StatusChangeEmailData;

export default StatusChangeEmail;
