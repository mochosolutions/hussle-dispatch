import { OutlinedInputProps } from '@mui/material/OutlinedInput';
interface Props extends OutlinedInputProps {
    value: string | number;
    onFilterChange: (value: string | number) => void;
    debounce?: number;
}
export default function DebouncedInput({ value: initialValue, onFilterChange, debounce, size, startAdornment, ...props }: Props): import("@emotion/react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map