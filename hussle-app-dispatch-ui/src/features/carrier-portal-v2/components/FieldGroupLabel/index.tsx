import type { ReactNode } from 'react';

import { KpiLabel } from 'components/Typography';

interface FieldGroupLabelProps {
  children: ReactNode;
}

const FieldGroupLabel: React.FC<FieldGroupLabelProps> = ({ children }) => {
  return (
    <KpiLabel
      sx={{
        display: 'block',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: 'text.secondary',
        mt: 1.75,
        mb: -0.5,
      }}
    >
      {children}
    </KpiLabel>
  );
};

export default FieldGroupLabel;
