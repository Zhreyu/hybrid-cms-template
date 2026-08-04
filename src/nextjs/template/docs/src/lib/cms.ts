import { configureSchema } from 'cms-renderer/lib/schema';
import { cmsConfig } from './cms-config';

const customSchema = configureSchema(cmsConfig);
export const postsSchema = customSchema.name('post');
export const categoriesSchema = customSchema.name('categories');
export const categoryGroupsSchema = customSchema.name('category_group');
export const sectionsSchema = customSchema.name('sections');
export const featuresSchema = customSchema.name('feature');
export const faqItemsSchema = customSchema.name('faq_item');
