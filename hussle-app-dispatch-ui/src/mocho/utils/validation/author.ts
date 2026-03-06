import * as Yup from 'yup';
import { InferType } from 'yup';
import { generateSlug } from '../slugify';

/**
 * Validation schema for author form
 * TypeScript types are automatically inferred from this schema
 */
export const authorSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  slug: Yup.string()
    .trim()
    .default(''),

  email: Yup.string()
    .required('Email is required')
    .email('Must be a valid email address')
    .trim(),

  avatar: Yup.string()
    .nullable()
    .optional()
    .url('Must be a valid URL')
    .trim(),

  bio: Yup.string()
    .nullable()
    .optional()
    .max(500, 'Bio must be less than 500 characters')
    .trim(),

  socialLinks: Yup.object({
    twitter: Yup.string()
      .nullable()
      .optional()
      .url('Must be a valid URL')
      .trim(),

    linkedin: Yup.string()
      .nullable()
      .optional()
      .url('Must be a valid URL')
      .trim(),

    github: Yup.string()
      .nullable()
      .optional()
      .url('Must be a valid URL')
      .trim(),

    website: Yup.string()
      .nullable()
      .optional()
      .url('Must be a valid URL')
      .trim(),
  })
    .nullable()
    .optional()
    .default({}),
}).required();

/**
 * TypeScript type automatically inferred from the Yup schema
 * This ensures the form values match the validation schema exactly
 */
export type AuthorFormValues = InferType<typeof authorSchema>;

/**
 * Helper function to generate slug from name
 * Uses shared slugify utility for consistency across all entities
 */
export function generateAuthorSlug(name: string): string {
  return generateSlug(name);
}
