import * as Yup from 'yup';
import { InferType } from 'yup';
import { PostStatus } from 'types/blog';

/**
 * Validation schema for blog post form
 * TypeScript types are automatically inferred from this schema
 */
export const blogPostSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),

  slug: Yup.string()
    .trim()
    .default(''),

  excerpt: Yup.string()
    .required('Excerpt is required')
    .min(10, 'Excerpt must be at least 10 characters')
    .max(160, 'Excerpt must be less than 160 characters')
    .trim(),

  content: Yup.string()
    .required('Content is required')
    .min(50, 'Content must be at least 50 characters')
    .test(
      'has-meaningful-content',
      'Content must contain more than just HTML tags',
      (value) => {
        if (!value) return false;
        // Strip HTML tags and check if there's actual text content
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        return textContent.length >= 50;
      }
    ),

  heroImage: Yup.string()
    .nullable()
    .optional()
    .trim(),

  heroImageAlt: Yup.string()
    .trim()
    .max(200, 'Image alt text must be less than 200 characters')
    .default(''),

  heroImageCaption: Yup.string()
    .trim()
    .max(500, 'Image caption must be less than 500 characters')
    .default(''),

  heroImageDocumentId: Yup.string()
    .nullable()
    .optional(),

  // HeroImageState is stored here for deferred upload (non-serializable)
  // Will be extracted before submission to saga
  // Validates structure if a value is present: { file: File, blobUrl: string, filename: string }
  heroImageFile: Yup.mixed()
    .nullable()
    .optional()
    .test(
      'valid-hero-image-state',
      'Invalid hero image state',
      (value) => {
        // null/undefined is valid (no image selected)
        if (value === null || value === undefined) {
          return true;
        }

        // If present, must be an object with required properties
        if (typeof value !== 'object') {
          return false;
        }

        const heroImageState = value as Record<string, unknown>;

        // Validate required properties
        if (!(heroImageState.file instanceof File)) {
          return false;
        }

        if (typeof heroImageState.blobUrl !== 'string' || !heroImageState.blobUrl) {
          return false;
        }

        if (typeof heroImageState.filename !== 'string' || !heroImageState.filename) {
          return false;
        }

        return true;
      }
    ),

  status: Yup.string()
    .oneOf([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.SCHEDULED] as const, 'Invalid status')
    .required('Status is required'),

  publishedAt: Yup.date()
    .nullable()
    .optional()
    .when('status', {
      is: PostStatus.PUBLISHED,
      then: (schema) => schema.max(new Date(), 'Published date cannot be in the future'),
      otherwise: (schema) => schema,
    }),

  authors: Yup.array()
    .of(Yup.string().required('Author ID is required'))
    .min(1, 'At least one author is required')
    .required('Authors are required'),

  categories: Yup.array()
    .of(Yup.string().required('Category ID is required'))
    .min(1, 'At least one category is required')
    .required('Categories are required'),
}).required();

/**
 * TypeScript type automatically inferred from the Yup schema
 * This ensures the form values match the validation schema exactly
 */
export type BlogPostFormValues = InferType<typeof blogPostSchema>;

/**
 * Helper function to generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Helper function to truncate excerpt
 */
export function truncateExcerpt(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}
