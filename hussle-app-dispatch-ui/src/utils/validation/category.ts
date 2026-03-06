import * as Yup from 'yup';
import { InferType } from 'yup';
import { generateSlug } from '../slugify';

/**
 * Validation schema for category form
 * TypeScript types are automatically inferred from this schema
 */
export const categorySchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),

  slug: Yup.string()
    .trim()
    .default(''),

  description: Yup.string()
    .nullable()
    .optional()
    .max(500, 'Description must be less than 500 characters')
    .trim(),
}).required();

/**
 * TypeScript type automatically inferred from the Yup schema
 * This ensures the form values match the validation schema exactly
 */
export type CategoryFormValues = InferType<typeof categorySchema>;

/**
 * Helper function to generate slug from title
 * Uses shared slugify utility for consistency across all entities
 */
export function generateCategorySlug(title: string): string {
  return generateSlug(title);
}
