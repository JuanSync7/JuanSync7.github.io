import { defineCollection, z } from 'astro:content';
import lessonTaxonomy from '../config/lesson-taxonomy.json';

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
    /** The post's cover: a figure id in src/figures (group 'cover'), or a template instance
     *  `<template>~<seed>`. figures:check enforces that it exists, is unique, and differs in
     *  style from its date neighbours. */
    cover: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*(~(0|[1-9]\d{0,8}))?$/).optional(),
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

// Learn articles: long explainers, each filed under one subject. `cover` is a figure id (or a
// template instance) drawn as the hero and on every card; `featured` puts the article on the
// writing page's shelf, at most one per subject (checked where the shelf is built).
export const LEARN_SUBJECTS = ['inference', 'silicon', 'agents'] as const;

const learn = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    subject: z.enum(LEARN_SUBJECTS),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    /** The shelf's drawing, when it is not the cover, and two captions under it: what to look at. */
    shelfFigure: z.string().optional(),
    shelfNotes: z.tuple([z.string(), z.string()]).optional(),
    eyebrow: z.string().optional(),
    tracker: z.enum(['inference-engines', 'frontier-models', 'inference-silicon']).optional(),
    art: artMotif.optional(),
    bg: artBg.optional(),
    date: z.coerce.date(),
  }),
});

// One lesson per file, named <date>-<slug>.yaml: the blog's lesson log reads them all.
const lessons = defineCollection({
  type: 'data',
  schema: z.object({
    date: z.coerce.date(),
    tag: z.string(),
    category: z.string().refine((id) => lessonTaxonomy.categories.some((category) => category.id === id), 'Unknown lesson category'),
    tags: z.array(z.string().refine((id) => lessonTaxonomy.tags.some((tag) => tag.id === id), 'Unknown lesson tag')).min(1).max(5).refine((tags) => new Set(tags).size === tags.length, 'Duplicate lesson tags'),
    title: z.string(),
    why: z.string(),
    problem: z.string().min(1).optional(),
    cause: z.string().min(1).optional(),
    steps: z.array(z.string().min(1)).min(1).optional(),
    solution: z.string().min(1).optional(),
    verification: z.string().min(1).optional(),
    limitations: z.string().min(1).optional(),
  }),
});

export const collections = { blog, releases, learn, lessons };

