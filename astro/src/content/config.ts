import { defineCollection, z } from 'astro:content';

// Shared art tokens — one definition for the ArticleArt motif/background, used by
// both `learn` (the canonical hero art) and `blog` (so a post can match its article).
const artMotif = z.enum(['loop', 'flow', 'lattice', 'orbit', 'stack', 'wave', 'mesh', 'terminal', 'detect', 'pixel', 'scatter', 'vortex', 'hub', 'blueprint']);
const artBg = z.enum(['auto', 'none', 'fan', 'burst', 'tunnel', 'cube', 'lens']);

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
    art: artMotif.optional(),
    bg: artBg.optional(),
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

const learn = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    eyebrow: z.string().optional(),
    tracker: z.enum(['inference-engines', 'frontier-models', 'inference-silicon']).optional(),
    art: artMotif.optional(),
    bg: artBg.optional(),
    date: z.coerce.date(),
  }),
});

export const collections = { blog, releases, learn };
