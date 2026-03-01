import { ReactNode } from 'react';
import { ButtonProps } from '@mui/material';
import { LoadingButtonProps } from '@mui/lab';
import { ButtonVariantProps, IconButtonShapeProps } from '../../types/extended';
interface Props extends LoadingButtonProps {
    color?: ButtonProps['color'];
    variant?: ButtonVariantProps;
    shape?: IconButtonShapeProps;
    children: ReactNode;
}
declare const LoadingButton: import('react').ForwardRefExoticComponent<Omit<Props, "ref"> & import('react').RefAttributes<HTMLButtonElement>>;
export default LoadingButton;
//# sourceMappingURL=LoadingButton.d.ts.map