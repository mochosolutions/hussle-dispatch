import { TooltipProps } from '@mui/material';
import { ColorProps } from '../../types/extended';
interface Props extends TooltipProps {
    color?: ColorProps | string;
    labelColor?: ColorProps | string;
    children: TooltipProps['children'];
}
export default function CustomTooltip({ children, arrow, labelColor, ...rest }: Props): import("@emotion/react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Tooltip.d.ts.map