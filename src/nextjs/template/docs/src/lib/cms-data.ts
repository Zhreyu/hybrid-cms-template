import { cache } from 'react';
import { categoriesSchema, postsSchema } from './cms';
import { cmsConfig } from './cms-config';

function logSchemaUrl(schemaName: string, id?: string, language?: string) {
  const url = new URL(`/api/schemas/${schemaName}`, cmsConfig.cmsUrl);
  if (cmsConfig.websiteId) url.searchParams.set('websiteId', cmsConfig.websiteId);
  if (language) url.searchParams.set('language', language);
  if (id) url.searchParams.set('id', id);
  console.log(`[cms-data] fetch → ${url.toString()}`);
}

export interface Post {
  title: string;
  content: string;
  [key: string]: unknown;
}

export interface Categories {
  category_name: string;
  post_list?: { _ref: string }[];
  [key: string]: unknown;
}

export const getCategories = cache(async (language?: string): Promise<Categories[]> => {
  logSchemaUrl('categories', undefined, language);
  try {
    const schema = language ? categoriesSchema.translation(language) : categoriesSchema;
    const results = await schema.fetchAll<Categories>();
    return results;
  } catch (err) {
    console.error('[getCategories] FETCH ERROR:', err);
    return [];
  }
});

export const getPost = cache(async (id: string, language?: string): Promise<Post | null> => {
  logSchemaUrl('post', id, language);
  try {
    const schema = language ? postsSchema.translation(language) : postsSchema;
    const result = await schema.fetchSingleById<Post>(id);

    return result;
  } catch (err) {
    console.error('[getPost] FETCH ERROR:', err);
    return null;
  }
});
