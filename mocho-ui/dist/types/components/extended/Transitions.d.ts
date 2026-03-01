import { CSSProperties, ExoticComponent, ReactElement } from 'react';
import { ZoomProps } from '@mui/material';
interface Props {
    children?: ReactElement;
    position?: string;
    sx?: CSSProperties;
    in?: boolean;
    type?: string;
    direction?: 'up' | 'right' | 'left' | 'down';
    [others: string]: any;
}
declare const Transitions: import('react').ForwardRefExoticComponent<Omit<Props, "ref"> & import('react').RefAttributes<ExoticComponent<{}>>>;
export default Transitions;
export declare const PopupTransition: import('react').ForwardRefExoticComponent<Omit<ZoomProps, "ref"> & import('react').RefAttributes<unknown>>;
//# sourceMappingURL=Transitions.d.ts.map