import type { ResolvedRouteParams } from 'cms-renderer/lib/types';
import { type Categories, getCategories, getSections, resolveRef, type Section } from './cms-data';

export function getSectionCategoryIds(section: Pick<Section, 'categories_list'>): string[] {
  return (section.categories_list ?? [])
    .map((ref) => ref._ref)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function getRouteCategoryId(routeParams?: ResolvedRouteParams): string | null {
  if (!routeParams) {
    return null;
  }

  const categoryParam =
    routeParams.category ??
    Object.values(routeParams).find((param) => param.schemaName === 'categories');
  const id = categoryParam?.document?.id;

  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function findSectionForCategory(
  sections: Section[],
  categoryId: string | null
): Section | null {
  if (!categoryId) {
    return null;
  }

  return sections.find((section) => getSectionCategoryIds(section).includes(categoryId)) ?? null;
}

export function resolveSectionCategories(
  section: Pick<Section, 'categories_list'> | null,
  categoriesById: Map<string, Categories>
): Categories[] {
  if (!section) {
    return [];
  }

  return (section.categories_list ?? [])
    .map((ref) => resolveRef(ref, categoriesById))
    .filter((category): category is Categories => category !== null);
}

export async function getSectionScopedCategories(routeParams?: ResolvedRouteParams): Promise<{
  categories: Categories[];
  activeSection: Section | null;
}> {
  const [sourceCategories, sourceSections] = await Promise.all([getCategories(), getSections()]);
  const categoryId = getRouteCategoryId(routeParams);
  const activeSection = findSectionForCategory(sourceSections, categoryId);
  const sourceCategoriesById = new Map(
    sourceCategories.map((category) => [String(category._id), category])
  );
  const sectionCategories = resolveSectionCategories(activeSection, sourceCategoriesById);

  return {
    categories: sectionCategories.length > 0 ? sectionCategories : sourceCategories,
    activeSection,
  };
}
