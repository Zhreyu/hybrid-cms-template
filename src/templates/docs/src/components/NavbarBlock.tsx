import type { BlockComponentProps, ResolvedRouteParams } from 'cms-renderer/lib/types';
import type { Header } from '@/generated/cms-schemas';
import { getSearchEntries } from '@/lib/search-index';
import NavbarClient, { type NavLink } from './NavbarClient';

export type NavbarBlockProps = Omit<Header, 'nav_links'> & {
  nav_links?: NavLink[];
};

function extractLanguage(routeParams?: ResolvedRouteParams): string | undefined {
  if (!routeParams) return undefined;
  return Object.values(routeParams).find((param) => param.schemaName === 'language')?.value;
}

export default async function NavbarBlock({
  content,
  routeParams,
  language: languageProp,
}: BlockComponentProps<NavbarBlockProps>) {
  const language = languageProp ?? extractLanguage(routeParams);
  const searchEntries = await getSearchEntries(language);

  return <NavbarClient content={content} searchEntries={searchEntries} />;
}
