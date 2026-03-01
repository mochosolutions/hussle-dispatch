import { ReactNode } from 'react';
import { AvatarProps } from '@mui/material';
import { AvatarTypeProps, ColorProps, SizeProps } from '../../types/extended';
export interface Props extends AvatarProps {
    color?: ColorProps;
    children?: ReactNode | string;
    type?: AvatarTypeProps;
    size?: SizeProps;
}
export default function Avatar({ variant, children, color, type, size, ...others }: Props): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Avatar.d.ts.map