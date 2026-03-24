import { Column, Hr, Row, Section } from '@react-email/components';
import {
  colors,
  divider,
  labelCell,
  table,
  tableRow,
  valueCell,
} from './emailStyles';

interface DataTableRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface DataTableProps {
  rows: DataTableRow[];
}

const highlightValueCell: React.CSSProperties = {
  ...valueCell,
  color: colors.primary,
  fontWeight: '700',
};

const DataTable = ({ rows }: DataTableProps) => (
  <Section style={table}>
    {rows.map((row, index) => (
      <div key={row.label}>
        {index > 0 ? <Hr style={divider} /> : null}
        <Row style={tableRow}>
          <Column style={labelCell}>{row.label}</Column>
          <Column style={row.highlight ? highlightValueCell : valueCell}>{row.value}</Column>
        </Row>
      </div>
    ))}
  </Section>
);

export default DataTable;
