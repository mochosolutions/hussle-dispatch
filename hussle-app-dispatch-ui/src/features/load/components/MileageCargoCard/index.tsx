import SectionCard from 'components/SectionCard';
import { DetailRow } from 'components/Typography';
import type { LoadDetail } from '../../types';

interface MileageCargoCardProps {
  load: LoadDetail;
}

export const MileageCargoCard: React.FC<MileageCargoCardProps> = ({ load }) => (
  <SectionCard title="Mileage & Cargo" contentSX={{ p: 0 }}>
    <DetailRow label="Loaded Miles" value={load.loadedMiles?.toLocaleString() ?? '\u2014'} />
    <DetailRow label="Deadhead Miles" value={load.deadheadMiles?.toLocaleString() ?? '\u2014'} />
    <DetailRow label="Total Miles" value={load.totalMiles?.toLocaleString() ?? '\u2014'} />
    <DetailRow label="Hazmat" value={load.isHazmat ? 'Yes' : 'No'} />
    <DetailRow label="Tarp" value={load.isTarp ? 'Yes' : 'No'} noBorder />
  </SectionCard>
);
