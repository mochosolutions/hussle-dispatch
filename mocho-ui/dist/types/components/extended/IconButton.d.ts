import { ReactNode, ReactChild, ReactFragment, ReactPortal } from 'react';
import { IconButtonProps } from '@mui/material';
import { ButtonVariantProps, IconButtonShapeProps } from '../../types/extended';
export interface Props extends IconButtonProps {
    shape?: IconButtonShapeProps;
    variant?: ButtonVariantProps;
    children: ReactNode;
    tooltip?: boolean | ReactChild | ReactFragment | ReactPortal;
}
declare const IconButton: import('react').ForwardRefExoticComponent<Omit<Props, "ref"> & import('react').RefAttributes<HTMLButtonElement>>;
export default IconButton;
//# sourceMappingURL=IconButton.d.ts.map