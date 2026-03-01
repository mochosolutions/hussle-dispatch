import { ComponentClass, FunctionComponent } from 'react';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { MenuProps } from './menu';
import { SnackbarProps } from './snackbar';
export type RootStateProps = {
    menu: MenuProps;
    snackbar: SnackbarProps;
};
export type KeyedObject = {
    [key: string]: string | number | KeyedObject | any;
};
export type OverrideIcon = (OverridableComponent<SvgIconTypeMap<object, 'svg'>> & {
    muiName: string;
}) | ComponentClass<any> | FunctionComponent<any>;
export interface GenericCardProps {
    title?: string;
    primary?: string | number | undefined;
    secondary?: string;
    content?: string;
    image?: string;
    dateTime?: string;
    iconPrimary?: OverrideIcon;
    color?: string;
    size?: string;
}
//# sourceMappingURL=root.d.ts.map