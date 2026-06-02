import type { DocumentMetadata, Reference } from 'cms-renderer/lib/types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { categoriesSchema, postsSchema, sectionsSchema } from './cms';
import { cmsConfig } from './cms-config';

export const CATEGORIES_CACHE_TAG = 'categories';
export const POSTS_CACHE_TAG = 'posts';
export const SECTIONS_CACHE_TAG = 'sections';

/**
 * Category document from the CMS.
 */
export interface Categories extends DocumentMetadata {
  name?: string;
  category_name: string;
  ordering?: number | string | null;
  post?: Reference[];
  post_list?: Reference[];
  [key: string]: unknown;
}

/**
 * Post document from the CMS.
 */
export interface Post extends DocumentMetadata {
  title: string;
  description: string;
  content: unknown;
  [key: string]: unknown;
}

/**
 * Section document from the CMS.
 */
export interface Section extends DocumentMetadata {
  title?: string;
  categories_list?: Reference[];
  [key: string]: unknown;
}

/**
 * Resolve a reference from a map with built-in validation.
 * Returns null if the reference is invalid or the document doesn't exist.
 */
export function resolveRef<T>(ref: Reference | undefined, map: Map<string, T>): T | null {
  if (!ref?._ref) return null;
  return map.get(ref._ref) ?? null;
}

function logSchemaUrl(schemaName: string, id?: string, language?: string) {
  const url = new URL(`/api/schemas/${schemaName}`, cmsConfig.cmsUrl);
  if (cmsConfig.websiteId) url.searchParams.set('websiteId', cmsConfig.websiteId);
  if (language) url.searchParams.set('language', language);
  if (id) url.searchParams.set('id', id);
  console.log(`[cms-data] fetch → ${url.toString()}`);
}

function getSidebarOrder(category: Categories): number {
  const value = category.ordering;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

export function getCategoryTitleField(category: Categories): 'name' | 'category_name' {
  return typeof category.name === 'string' && category.name.trim().length > 0
    ? 'name'
    : 'category_name';
}

export function getCategoryTitle(category: Categories): string {
  const preferredField = getCategoryTitleField(category);
  const preferredValue = category[preferredField];
  if (typeof preferredValue === 'string' && preferredValue.trim().length > 0) {
    return preferredValue;
  }

  return '';
}

export function getCategoryRefs(category: Pick<Categories, 'post' | 'post_list'>): Reference[] {
  if (Array.isArray(category.post) && category.post.length > 0) {
    return category.post;
  }

  return Array.isArray(category.post_list) ? category.post_list : [];
}

function normalizeIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function buildDocumentMap<T>(
  ids: string[],
  load: (id: string) => Promise<T | null>
): Promise<Map<string, T>> {
  const uniqueIds = normalizeIds(ids);

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const document = await load(id);
      return document ? ([id, document] as const) : null;
    })
  );

  const filteredEntries: Array<readonly [string, T]> = [];
  for (const entry of entries) {
    if (entry) {
      filteredEntries.push(entry);
    }
  }

  return new Map(filteredEntries);
}

function sortCategories(categories: Categories[]): Categories[] {
  return [...categories].sort((left, right) => {
    const orderDiff = getSidebarOrder(left) - getSidebarOrder(right);
    if (orderDiff !== 0) return orderDiff;

    return getCategoryTitle(left).localeCompare(getCategoryTitle(right));
  });
}

/**
 * Fetch all categories with cross-request caching.
 * Cache persists for 60s and is shared across all concurrent requests.
 *
 * Uses React.cache for request-level deduplication to ensure multiple
 * components calling getCategories() in the same render share results.
 */
const fetchCachedCategories = (language?: string): Promise<Categories[]> =>
  unstable_cache(
    async () => {
      logSchemaUrl('categories', undefined, language);
      const schema = language ? categoriesSchema.translation(language) : categoriesSchema;
      const results = await schema.fetchAll();
      return sortCategories(results as Categories[]);
    },
    ['categories', language ?? 'default'],
    { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] }
  )();

export const getCategories = cache(async (language?: string): Promise<Categories[]> => {
  try {
    return await fetchCachedCategories(language);
  } catch (err) {
    console.error('[getCategories] FETCH ERROR:', err);
    return [];
  }
});

/**
 * Fetch a single post by ID with cross-request caching.
 *
 * Uses React.cache for request-level deduplication.
 */
const fetchCachedPost = (id: string, language?: string): Promise<Post | null> =>
  unstable_cache(
    async () => {
      logSchemaUrl('post', id, language);
      const schema = language ? postsSchema.translation(language) : postsSchema;
      return (await schema.fetchSingleById(id)) as Post | null;
    },
    ['post', id, language ?? 'default'],
    { revalidate: 60, tags: [POSTS_CACHE_TAG] }
  )();

export const getPost = cache(async (id: string, language?: string): Promise<Post | null> => {
  try {
    return await fetchCachedPost(id, language);
  } catch (err) {
    console.error('[getPost] FETCH ERROR:', err);
    return null;
  }
});

/**
 * Fetch multiple posts with the existing per-post cache.
 */
export const getPostsByIds = (ids: string[], language?: string): Promise<Map<string, Post>> => {
  return buildDocumentMap(ids, (id) => getPost(id, language));
};

/**
 * Fetch a single section by ID with cross-request caching.
 */
const fetchCachedSection = (id: string, language?: string): Promise<Section | null> =>
  unstable_cache(
    async () => {
      logSchemaUrl('sections', id, language);
      const schema = language ? sectionsSchema.translation(language) : sectionsSchema;
      return (await schema.fetchSingleById(id)) as Section | null;
    },
    ['sections', id, language ?? 'default'],
    { revalidate: 60, tags: [SECTIONS_CACHE_TAG] }
  )();

export const getSection = cache(async (id: string, language?: string): Promise<Section | null> => {
  try {
    return await fetchCachedSection(id, language);
  } catch (err) {
    console.error('[getSection] FETCH ERROR:', err);
    return null;
  }
});

/**
 * Fetch multiple sections with the existing per-section cache.
 */
export const getSectionsByIds = (
  ids: string[],
  language?: string
): Promise<Map<string, Section>> => {
  return buildDocumentMap(ids, (id) => getSection(id, language));
};
