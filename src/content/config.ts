import { z, defineCollection } from "astro:content";
const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

const speechSchema = z.object({
    title: z.string(),
    description: z.string(),
    conference: z.string(),
    conferenceDate: z.coerce.date(),
    pubDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

export type BlogSchema = z.infer<typeof blogSchema>;
export type SpeechSchema = z.infer<typeof speechSchema>;

const blogCollection = defineCollection({ schema: blogSchema });
const speechCollection = defineCollection({ schema: speechSchema });

export const collections = {
    'blog': blogCollection,
    'speeches': speechCollection
}