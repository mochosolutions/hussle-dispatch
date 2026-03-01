import { default as React } from 'react';
import { DocumentCategory } from '../../../types/documents';
import { FormikFieldProps } from '../types';
/**
 * Props for DocumentImageUploadField
 */
export interface DocumentImageUploadFieldProps {
    /** Field name for document ID in Formik */
    name: string;
    /** Field name for storing the preview URL */
    urlFieldName?: string;
    /** Field label */
    label: string;
    /** Document category */
    category: DocumentCategory;
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
 * DocumentImageUploadField - File upload using presigned URLs with processing status.
 *
 * Features:
 * - Presigned URL upload (bypasses API for file transfer)
 * - Real-time upload progress
 * - Processing status polling
 * - Preview with processed image variants
 * - Client-side validation
 * - Automatic cleanup on cancel/error
 */
export declare const DocumentImageUploadField: React.FC<DocumentImageUploadFieldProps>;
export default DocumentImageUploadField;
//# sourceMappingURL=index.d.ts.map