import { configureSchema } from 'cms-renderer/lib/schema';
import { cmsConfig } from './cms-config';

export const customSchema = configureSchema(cmsConfig);
export const postsSchema = customSchema.name('post');
export const categoriesSchema = customSchema.name('categories');
