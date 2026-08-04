import type { ResolvedRouteParams } from 'cms-renderer/lib/types';

/** Docs article routes resolve a `post` param; static routes like `/blog` do not. */
export function showsLanguageDropdown(routeParams?: ResolvedRouteParams): boolean {
  if (!routeParams) return false;
  return Object.values(routeParams).some((param) => param.schemaName === 'post');
}
