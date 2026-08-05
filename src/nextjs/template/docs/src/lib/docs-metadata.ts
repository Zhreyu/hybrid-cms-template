import { getCmsClient } from 'cms-renderer/lib/cms-api';
import type { ResolvedRouteParams } from 'cms-renderer/lib/types';
import { cmsConfig } from '@/lib/cms-config';
import { getDisplayTitle } from '@/lib/display-title';

export const SITE_NAME = 'ProfoundCMS Template';
export const DEFAULT_DOCS_DESCRIPTION = 'Welcome to the ProfoundCMS Template documentation';

export interface DocsRouteMetadata {
  path: string;
  title: string;
  description: string;
  sectionLabel: string;
}

type RuntimeRouteParamDocument = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  published_content?: unknown;
  draft_content?: unknown;
};

type RuntimeRouteParam = {
  value?: unknown;
  schemaName?: unknown;
  document?: RuntimeRouteParamDocument;
};

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getSiteUrl(): string {
  const explicitUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || '';
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, '');
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || '';
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  }

  return 'http://localhost:3005';
}

function getDocumentContent(document?: RuntimeRouteParamDocument): Record<string, unknown> {
  const content = document?.content ?? document?.published_content ?? document?.draft_content;
  return content && typeof content === 'object' ? (content as Record<string, unknown>) : {};
}

function getRouteParam(
  routeParams: ResolvedRouteParams | Record<string, unknown> | undefined,
  key: string,
  schemaName: string
): RuntimeRouteParam | null {
  if (!routeParams || typeof routeParams !== 'object') {
    return null;
  }

  const directParam = (routeParams as Record<string, unknown>)[key];
  if (directParam && typeof directParam === 'object') {
    return directParam as RuntimeRouteParam;
  }

  const matchingParam = Object.values(routeParams).find(
    (param) =>
      param && typeof param === 'object' && (param as RuntimeRouteParam).schemaName === schemaName
  );

  return matchingParam ? (matchingParam as RuntimeRouteParam) : null;
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

export function getDocsPathFromSlug(slug: string[]): string {
  return `/${slug.filter(Boolean).join('/')}`;
}

export function getDocsOpenGraphImageUrl(path: string): URL {
  const url = new URL('/api/og', getMetadataBase());
  url.searchParams.set('path', path);
  return url;
}

function buildDocsMetadataFromRouteParams(
  path: string,
  routeParams: ResolvedRouteParams | Record<string, unknown> | undefined
): DocsRouteMetadata {
  const postParam = getRouteParam(routeParams, 'post', 'post');
  const categoryParam = getRouteParam(routeParams, 'category', 'categories');
  const postDocument = postParam?.document;
  const categoryDocument = categoryParam?.document;
  const postContent = getDocumentContent(postDocument);
  const categoryContent = getDocumentContent(categoryDocument);
  const title =
    getDisplayTitle({
      ...postContent,
      _title:
        readString(postContent._title) ??
        readString(postDocument?.title) ??
        readString(postContent.title) ??
        undefined,
    }) || SITE_NAME;
  const description =
    readString(postContent.description) ||
    readString(postDocument?.title) ||
    DEFAULT_DOCS_DESCRIPTION;
  const sectionLabel =
    getDisplayTitle({
      _title: readString(categoryDocument?.title) ?? undefined,
      ...categoryContent,
    }) ||
    readString(categoryDocument?.title) ||
    '';

  return {
    path,
    title,
    description,
    sectionLabel,
  };
}

export async function getDocsRouteMetadata(path: string): Promise<DocsRouteMetadata> {
  if (!cmsConfig.websiteId) {
    return {
      path,
      title: SITE_NAME,
      description: DEFAULT_DOCS_DESCRIPTION,
      sectionLabel: '',
    };
  }

  const client = getCmsClient(cmsConfig);

  try {
    const { resolvedParams } = await client.route.getByPath.query({
      websiteId: cmsConfig.websiteId,
      path,
      preview: false,
    });

    return buildDocsMetadataFromRouteParams(path, resolvedParams);
  } catch {
    return {
      path,
      title: SITE_NAME,
      description: DEFAULT_DOCS_DESCRIPTION,
      sectionLabel: '',
    };
  }
}
