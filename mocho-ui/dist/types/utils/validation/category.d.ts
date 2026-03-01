import { InferType } from 'yup';
import * as Yup from 'yup';
/**
 * Validation schema for category form
 * TypeScript types are automatically inferred from this schema
 */
export declare const categorySchema: Yup.ObjectSchema<{
    title: string;
    slug: string;
    description: string | null | undefined;
}, Yup.AnyObject, {
    title: undefined;
    slug: "";
    description: undefined;
}, "">;
/**
 * TypeScript type automatically inferred from the Yup schema
 * This ensures the form values match the validation schema exactly
 */
export type CategoryFormValues = InferType<typeof categorySchema>;
/**
 * Helper function to generate slug from title
 * Uses shared slugify utility for consistency across all entities
 */
export declare function generateCategorySlug(title: string): string;
//# sourceMappingURL=category.d.ts.map