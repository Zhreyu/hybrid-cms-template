import { getCmsClient } from 'cms-renderer/lib/cms-api';
import type { DocumentMetadata, Reference } from 'cms-renderer/lib/types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  categoriesSchema,
  categoryGroupsSchema,
  faqItemsSchema,
  featuresSchema,
  postsSchema,
  sectionsSchema,
} from './cms';
import { cmsConfig } from './cms-config';

const CATEGORIES_CACHE_TAG = 'categories';
const CATEGORY_GROUPS_CACHE_TAG = 'category-groups';
const POSTS_CACHE_TAG = 'posts';
const SECTIONS_CACHE_TAG = 'sections';
const FEATURES_CACHE_TAG = 'features';
const FAQ_ITEMS_CACHE_TAG = 'faq-items';
export type DocsPostApiIcon = 'get' | 'post' | 'options' | 'patch' | 'custom';

const IN_PROCESS_CACHE_TTL_MS = 60_000;
const requestCache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

function memoizeCmsRequest<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = requestCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.promise as Promise<T>;
  }

  const promise = load().catch((error) => {
    requestCache.delete(key);
    throw error;
  });
  requestCache.set(key, {
    expiresAt: now + IN_PROCESS_CACHE_TTL_MS,
    promise,
  });
  return promise;
}

function cacheKeyPart(value?: string): string {
  return value ?? 'default';
}

function idsCacheKey(ids: string[]): string {
  return [...ids].sort().join(',');
}

/**
 * Category document from the CMS.
 */
export interface Categories extends DocumentMetadata {
  name?: string;
  category_name: string;
  ordering?: number | string | null;
  group?: Reference[];
  groups?: Reference[];
  post?: Reference[];
  post_list?: Reference[];
  _editorFieldOrder?: string[];
  [key: string]: unknown;
}

/**
 * Category group document from the CMS.
 */
export interface CategoryGroup extends DocumentMetadata {
  title?: string;
  ordering?: number | string | null;
  default_open?: boolean | null;
  post?: Reference[];
  post_list?: Reference[];
  [key: string]: unknown;
}

/**
 * Post document from the CMS.
 */
export interface DocsPost extends DocumentMetadata {
  title: string;
  description: string;
  content: unknown;
  icon?: string;
  icon_api?: DocsPostApiIcon;
  _routePath?: string;
  [key: string]: unknown;
}

export interface FeatureDocument extends DocumentMetadata {
  title?: string;
  description?: string;
  url?: string;
  icon?: unknown;
  [key: string]: unknown;
}

export interface FaqItemDocument extends DocumentMetadata {
  title?: string;
  question?: string;
  answer?: unknown;
  default_open?: boolean | null;
  ordering?: number | string | null;
  [key: string]: unknown;
}

/**
 * Section document from the CMS.
 */
export interface Section extends DocumentMetadata {
  title?: string;
  ordering?: number | string | null;
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
  // Mirror the branching in cms-renderer's buildBaseUrl so the log reflects where
  // the fetch actually goes: the standalone dataset service when DATASET_ENDPOINT
  // is set, otherwise the CMS app's /api/schemas route.
  const url = cmsConfig.datasetEndpoint
    ? new URL(`/dataset/${schemaName}`, cmsConfig.datasetEndpoint)
    : new URL(`/api/schemas/${schemaName}`, cmsConfig.cmsUrl);
  if (cmsConfig.websiteId) url.searchParams.set('websiteId', cmsConfig.websiteId);
  if (language) url.searchParams.set('language', language);
  if (id) url.searchParams.set('id', id);
  console.log(`[cms-data] fetch → ${url.toString()}`);
}

function getSidebarOrder(category: Categories): number {
  return getOrderingValue(category.ordering);
}

export function getOrderingValue(value: number | string | null | undefined): number {
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

function getCategoryTitle(category: Categories): string {
  const preferredField = getCategoryTitleField(category);
  const preferredValue = category[preferredField];
  if (typeof preferredValue === 'string' && preferredValue.trim().length > 0) {
    return preferredValue;
  }

  return '';
}

export function getPostRefs(
  source: Pick<Categories | CategoryGroup, 'post' | 'post_list'>
): Reference[] {
  if (Array.isArray(source.post) && source.post.length > 0) {
    return source.post;
  }

  return Array.isArray(source.post_list) ? source.post_list : [];
}

export function getCategoryRefs(category: Pick<Categories, 'post' | 'post_list'>): Reference[] {
  return getPostRefs(category);
}

export function getCategoryGroupRefs(category: Pick<Categories, 'group' | 'groups'>): Reference[] {
  if (Array.isArray(category.group) && category.group.length > 0) {
    return category.group;
  }

  return Array.isArray(category.groups) ? category.groups : [];
}

export function getCategoryPostRefs(
  category: Pick<Categories, 'post' | 'post_list' | 'group' | 'groups' | '_editorFieldOrder'>,
  groupsById: Map<string, CategoryGroup>
): Reference[] {
  const refs: Reference[] = [];

  const fieldOrder = Array.isArray(category._editorFieldOrder) ? category._editorFieldOrder : [];

  for (const field of fieldOrder) {
    if (field === 'post' || field === 'post_list') {
      refs.push(...getCategoryRefs(category));
    }

    if (field === 'group' || field === 'groups') {
      const groups = getCategoryGroupRefs(category)
        .map((groupRef) => resolveRef(groupRef, groupsById))
        .filter((group): group is CategoryGroup => group !== null);

      for (const group of sortCategoryGroups(groups)) {
        refs.push(...getPostRefs(group));
      }
    }
  }

  if (refs.length > 0) {
    return refs;
  }

  const fallbackRefs = [...getCategoryRefs(category)];
  const groups = getCategoryGroupRefs(category)
    .map((groupRef) => resolveRef(groupRef, groupsById))
    .filter((group): group is CategoryGroup => group !== null);

  for (const group of sortCategoryGroups(groups)) {
    fallbackRefs.push(...getPostRefs(group));
  }

  return fallbackRefs;
}

export function getCategoryGroupIds(categories: Pick<Categories, 'group' | 'groups'>[]): string[] {
  return normalizeIds(
    categories.flatMap((category) =>
      getCategoryGroupRefs(category)
        .map((ref) => ref._ref)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );
}

function normalizeIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export function isRouteRefId(id: string): boolean {
  return id.startsWith('/');
}

function sortCategories(categories: Categories[]): Categories[] {
  return [...categories].sort((left, right) => {
    const orderDiff = getSidebarOrder(left) - getSidebarOrder(right);
    if (orderDiff !== 0) return orderDiff;

    return getCategoryTitle(left).localeCompare(getCategoryTitle(right));
  });
}

function getGroupTitle(group: CategoryGroup): string {
  const title = group.title;
  return typeof title === 'string' && title.trim().length > 0 ? title : '';
}

export function sortCategoryGroups(groups: CategoryGroup[]): CategoryGroup[] {
  return [...groups].sort((left, right) => {
    const orderDiff = getOrderingValue(left.ordering) - getOrderingValue(right.ordering);
    if (orderDiff !== 0) return orderDiff;

    return getGroupTitle(left).localeCompare(getGroupTitle(right));
  });
}

function getSectionTitle(section: Section): string {
  const title = section.title;
  return typeof title === 'string' && title.trim().length > 0 ? title : '';
}

function sortSections(sections: Section[]): Section[] {
  return [...sections].sort((left, right) => {
    const orderDiff = getOrderingValue(left.ordering) - getOrderingValue(right.ordering);
    if (orderDiff !== 0) return orderDiff;

    return getSectionTitle(left).localeCompare(getSectionTitle(right));
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
  memoizeCmsRequest(`categories:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('categories', undefined, language);
        const schema = language ? categoriesSchema.translation(language) : categoriesSchema;
        const results = await schema.fetchAll();
        return sortCategories(results as Categories[]);
      },
      ['categories', language ?? 'default'],
      { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] }
    )()
  );

export const getCategories = cache(async (language?: string): Promise<Categories[]> => {
  try {
    return await fetchCachedCategories(language);
  } catch (err) {
    console.error('[getCategories] FETCH ERROR:', err);
    return [];
  }
});

const fetchCachedCategoryGroup = (id: string, language?: string): Promise<CategoryGroup | null> =>
  memoizeCmsRequest(`category-group:${id}:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('category_group', id, language);
        const schema = language ? categoryGroupsSchema.translation(language) : categoryGroupsSchema;
        return (await schema.fetchSingleById(id)) as CategoryGroup | null;
      },
      ['category-group', id, language ?? 'default'],
      { revalidate: 60, tags: [CATEGORY_GROUPS_CACHE_TAG] }
    )()
  );

const getCategoryGroup = cache(
  async (id: string, language?: string): Promise<CategoryGroup | null> => {
    try {
      return await fetchCachedCategoryGroup(id, language);
    } catch (err) {
      console.error('[getCategoryGroup] FETCH ERROR:', err);
      return null;
    }
  }
);

export const getCategoryGroupsByIds = async (
  ids: string[],
  language?: string
): Promise<Map<string, CategoryGroup>> => {
  const groups = await Promise.all(normalizeIds(ids).map((id) => getCategoryGroup(id, language)));
  return new Map(
    sortCategoryGroups(groups.filter((group): group is CategoryGroup => group !== null)).map(
      (group) => [String(group._id), group]
    )
  );
};

export async function getCategoryPostRefsMap(
  categories: Categories[]
): Promise<Map<string, Reference[]>> {
  const groupsById = await getCategoryGroupsByIds(getCategoryGroupIds(categories));
  return new Map(
    categories.map((category) => [String(category._id), getCategoryPostRefs(category, groupsById)])
  );
}

/**
 * Fetch a single post by ID with cross-request caching.
 *
 * Uses React.cache for request-level deduplication.
 */
const fetchCachedPost = (id: string, language?: string): Promise<DocsPost | null> =>
  memoizeCmsRequest(`post:${id}:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('post', id, language);
        const schema = language ? postsSchema.translation(language) : postsSchema;
        return (await schema.fetchSingleById(id)) as DocsPost | null;
      },
      ['post', id, language ?? 'default'],
      { revalidate: 60, tags: [POSTS_CACHE_TAG] }
    )()
  );

export const getPost = cache(async (id: string, language?: string): Promise<DocsPost | null> => {
  if (isRouteRefId(id)) {
    return getStaticRoutePost(id);
  }

  try {
    return await fetchCachedPost(id, language);
  } catch (err) {
    console.error('[getPost] FETCH ERROR:', err);
    return null;
  }
});

const fetchCachedFeature = (id: string): Promise<FeatureDocument | null> =>
  memoizeCmsRequest(`feature:${id}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('feature', id);
        return (await featuresSchema.fetchSingleById(id)) as FeatureDocument | null;
      },
      ['feature', id],
      { revalidate: 60, tags: [FEATURES_CACHE_TAG] }
    )()
  );

const getFeature = cache(async (id: string): Promise<FeatureDocument | null> => {
  try {
    return await fetchCachedFeature(id);
  } catch (err) {
    console.error('[getFeature] FETCH ERROR:', err);
    return null;
  }
});

export const getFeaturesByIds = (ids: string[]): Promise<Map<string, FeatureDocument>> => {
  return Promise.all(normalizeIds(ids).map((id) => getFeature(id))).then(
    (features) =>
      new Map(
        features
          .filter((feature): feature is FeatureDocument => feature !== null)
          .map((feature) => [String(feature._id), feature])
      )
  );
};

const fetchCachedFaqItem = (id: string, language?: string): Promise<FaqItemDocument | null> =>
  memoizeCmsRequest(`faq-item:${id}:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('faq_item', id, language);
        const schema = language ? faqItemsSchema.translation(language) : faqItemsSchema;
        return (await schema.fetchSingleById(id)) as FaqItemDocument | null;
      },
      ['faq-item', id, language ?? 'default'],
      { revalidate: 60, tags: [FAQ_ITEMS_CACHE_TAG] }
    )()
  );

const getFaqItem = cache(async (id: string, language?: string): Promise<FaqItemDocument | null> => {
  try {
    return await fetchCachedFaqItem(id, language);
  } catch (err) {
    console.error('[getFaqItem] FETCH ERROR:', err);
    return null;
  }
});

export const getFaqItemsByIds = (
  ids: string[],
  language?: string
): Promise<Map<string, FaqItemDocument>> => {
  return Promise.all(normalizeIds(ids).map((id) => getFaqItem(id, language))).then(
    (items) =>
      new Map(
        items
          .filter((item): item is FaqItemDocument => item !== null)
          .map((item) => [String(item._id), item])
      )
  );
};

const fetchCachedPostsBatch = (ids: string[], language?: string): Promise<DocsPost[]> =>
  memoizeCmsRequest(`posts-batch:${idsCacheKey(ids)}:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('post', `ids=${ids.length}`, language);
        const schema = language ? postsSchema.translation(language) : postsSchema;
        const map = await schema.fetchByIds<DocsPost>(ids);
        return [...map.values()];
      },
      ['posts-batch', [...ids].sort().join(','), language ?? 'default'],
      { revalidate: 60, tags: [POSTS_CACHE_TAG] }
    )()
  );

/**
 * Fetch multiple posts in a single batched request, keyed by document id.
 */
export const getPostsByIds = async (
  ids: string[],
  language?: string
): Promise<Map<string, DocsPost>> => {
  const uniqueIds = normalizeIds(ids);
  if (uniqueIds.length === 0) {
    return new Map();
  }

  try {
    const posts = await fetchCachedPostsBatch(uniqueIds, language);
    const map = new Map<string, DocsPost>();
    for (const post of posts) {
      if (post?._id) {
        map.set(post._id, post);
      }
    }
    return map;
  } catch (err) {
    console.error('[getPostsByIds] FETCH ERROR:', err);
    return new Map();
  }
};

const fetchCachedStaticRoutePost = (path: string): Promise<DocsPost | null> =>
  memoizeCmsRequest(`static-route-post:${path}`, () =>
    unstable_cache(
      async () => {
        if (!cmsConfig.websiteId) {
          return null;
        }

        const client = getCmsClient(cmsConfig);
        const { route } = await client.route.getByPath.query({
          websiteId: cmsConfig.websiteId,
          path,
          skipValidation: true,
        });

        const blocks = await client.block.getByIds.query({
          websiteId: cmsConfig.websiteId,
          ids: route.block_ids,
        });

        const uiContentBlock = blocks.find(
          (block: { schema_name?: string } | null | undefined) => block?.schema_name === 'uicontent'
        );
        const content = uiContentBlock?.published_content as Record<string, unknown> | null;
        if (!content) {
          return null;
        }

        const title =
          typeof content.title === 'string' && content.title.trim().length > 0
            ? content.title
            : route.label || route.path;

        return {
          _id: route.path,
          _title: title,
          _routePath: route.path,
          title,
          description: typeof content.description === 'string' ? content.description : '',
          content: content.content ?? '',
        };
      },
      ['static-route-post', path],
      { revalidate: 60, tags: [POSTS_CACHE_TAG] }
    )()
  );

const getStaticRoutePost = cache(async (path: string): Promise<DocsPost | null> => {
  try {
    return await fetchCachedStaticRoutePost(path);
  } catch (err) {
    console.error('[getStaticRoutePost] FETCH ERROR:', err);
    return null;
  }
});

export const getPostsAndStaticRoutesByIds = async (
  ids: string[],
  language?: string
): Promise<Map<string, DocsPost>> => {
  const normalizedIds = normalizeIds(ids);
  const documentIds = normalizedIds.filter((id) => !isRouteRefId(id));
  const routeIds = normalizedIds.filter(isRouteRefId);

  const [documents, staticRoutes] = await Promise.all([
    getPostsByIds(documentIds, language),
    Promise.all(
      routeIds.map(async (id) => {
        const post = await getStaticRoutePost(id);
        return post ? ([id, post] as const) : null;
      })
    ),
  ]);

  const result = new Map(documents);
  for (const entry of staticRoutes) {
    if (entry) {
      result.set(entry[0], entry[1]);
    }
  }
  return result;
};

/**
 * Fetch a single section by ID with cross-request caching.
 */
const fetchCachedSection = (id: string, language?: string): Promise<Section | null> =>
  memoizeCmsRequest(`section:${id}:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('sections', id, language);
        const schema = language ? sectionsSchema.translation(language) : sectionsSchema;
        return (await schema.fetchSingleById(id)) as Section | null;
      },
      ['sections', id, language ?? 'default'],
      { revalidate: 60, tags: [SECTIONS_CACHE_TAG] }
    )()
  );

const getSection = cache(async (id: string, language?: string): Promise<Section | null> => {
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
  return Promise.all(normalizeIds(ids).map((id) => getSection(id, language))).then(
    (sections) =>
      new Map(
        sections
          .filter((section): section is Section => section !== null)
          .map((section) => [String(section._id), section])
      )
  );
};

/**
 * Fetch all sections with cross-request caching.
 */
const fetchCachedSections = (language?: string): Promise<Section[]> =>
  memoizeCmsRequest(`sections-all:${cacheKeyPart(language)}`, () =>
    unstable_cache(
      async () => {
        logSchemaUrl('sections', undefined, language);
        const schema = language ? sectionsSchema.translation(language) : sectionsSchema;
        const results = await schema.fetchAll();
        return sortSections(results as Section[]);
      },
      ['sections-all', language ?? 'default'],
      { revalidate: 60, tags: [SECTIONS_CACHE_TAG] }
    )()
  );

export const getSections = cache(async (language?: string): Promise<Section[]> => {
  try {
    return await fetchCachedSections(language);
  } catch (err) {
    console.error('[getSections] FETCH ERROR:', err);
    return [];
  }
});
