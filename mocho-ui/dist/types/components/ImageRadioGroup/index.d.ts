import { default as React } from 'react';
interface ImageRadioOption {
    value: string;
    title: string;
    imageUrl: string;
}
interface ImageRadioGroupProps {
    options: ImageRadioOption[];
    selectedValue?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
}
declare const ImageRadioGroup: React.FC<ImageRadioGroupProps>;
export default ImageRadioGroup;
//# sourceMappingURL=index.d.ts.map