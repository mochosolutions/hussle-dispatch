import { ReactNode } from 'react';
export type ScaleProps = {
    hover: number | string | undefined;
    tap: number | string | undefined;
};
export interface Props {
    children?: ReactNode;
    type?: 'slide' | 'scale' | 'rotate';
    direction?: 'up' | 'down' | 'left' | 'right';
    offset?: number;
    scale?: ScaleProps;
}
export default function AnimateButton({ children, type, direction, offset, scale, }: Props): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnimateButton.d.ts.map