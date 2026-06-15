import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.enum(['silicon', 'software', 'tutorials', 'thoughts', 'projects']),
    date: z.coerce.date(),
    readTime: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    size: z.enum(['large', 'medium', 'small']).default('small'),
    externalUrl: z.string().optional(),
  }),
});

const releases = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

export const collections = { blog, releases };
