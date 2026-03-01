import { InferType } from 'yup';
import * as Yup from 'yup';
/**
 * Validation schema for author form
 * TypeScript types are automatically inferred from this schema
 */
export declare const authorSchema: Yup.ObjectSchema<{
    name: string;
    slug: string;
    email: string;
    avatar: string | null | undefined;
    bio: string | null | undefined;
    socialLinks: {
        twitter?: string | null | undefined;
        linkedin?: string | null | undefined;
        github?: string | null | undefined;
        website?: string | null | undefined;
    } | null;
}, Yup.AnyObject, {
    name: undefined;
    slug: "";
    email: undefined;
    avatar: undefined;
    bio: undefined;
    socialLinks: {};
}, "">;
/**
 * TypeScript type automatically inferred from the Yup schema
 * This ensures the form values match the validation schema exactly
 */
export type AuthorFormValues = InferType<typeof authorSchema>;
/**
 * Helper function to generate slug from name
 * Uses shared slugify utility for consistency across all entities
 */
export declare function generateAuthorSlug(name: string): string;
//# sourceMappingURL=author.d.ts.map