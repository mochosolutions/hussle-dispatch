import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
interface Props extends MuiAppBarProps {
    open?: boolean;
}
declare const AppBarStyled: import('@emotion/styled').StyledComponent<import('@mui/material').AppBarOwnProps & Omit<import('@mui/material').PaperOwnProps, "classes" | "color" | "position"> & import('@mui/material/OverridableComponent').CommonProps & Omit<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLElement>, HTMLElement>, "ref"> & {
    ref?: ((instance: HTMLElement | null) => void | import('react').DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof import('react').DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | import('react').RefObject<HTMLElement> | null | undefined;
}, "children" | "style" | "className" | "classes" | "sx" | "color" | "position" | "elevation" | "square" | "variant" | "enableColorOnDark"> & import('@mui/system').MUIStyledCommonProps<import('@mui/material').Theme> & Props, {}, {}>;
export default AppBarStyled;
//# sourceMappingURL=AppBarStyled.d.ts.map