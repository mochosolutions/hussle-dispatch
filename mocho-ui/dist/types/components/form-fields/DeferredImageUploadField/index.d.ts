import { default as React } from 'react';
import { FormikFieldProps } from '../types';
/**
 * Hero image state stored in form
 */
export interface HeroImageState {
    file: File;
    blobUrl: string;
    filename: string;
}
/**
 * Props for DeferredImageUploadField
 */
export interface DeferredImageUploadFieldProps {
    /** Field name for storing HeroImageState in Formik */
    name: string;
    /** Field name for existing URL (edit mode) */
    existingUrlFieldName?: string;
    /** Field label */
    label: string;
    /** Accepted file types */
    accept?: string;
    /** Maximum file size in MB */
    maxSizeMB?: number;
    /** Preview height in pixels */
    previewHeight?: number;
    /** Helper text */
    helperText?: string;
    /** Formik props */
    formik: FormikFieldProps;
}
/**
 * DeferredImageUploadField - File upload with deferred upload pattern.
 *
 * Features:
 * - Shows blob URL preview immediately (no network request)
 * - Stores file in form state for later upload
 * - Upload happens on form submit via saga
 * - Client-side validation before accepting file
 */
export declare const DeferredImageUploadField: React.FC<DeferredImageUploadFieldProps>;
export default DeferredImageUploadField;
//# sourceMappingURL=index.d.ts.map