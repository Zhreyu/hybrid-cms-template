import * as HeroiconsOutline from '@heroicons/react/24/outline';
import * as HeroiconsSolid from '@heroicons/react/24/solid';
import type { BlockComponentProps } from 'cms-renderer/lib/types';
import type { ElementType, SVGProps } from 'react';
import type { Feature, FeatureSection } from '@/generated/cms-schemas';
import type { FeatureDocument } from '@/lib/cms-data';
import { getFeaturesByIds } from '@/lib/cms-data';
import { parseHeroiconValue, toHeroiconExportName } from '@/lib/util';
import { DocsPageHeader, DocsPageToc } from './DocsPageChrome';

type FeatureLayout = 'grid' | 'list';

type ResolvedFeatureRecord = {
  _resolved?: FeatureItem | FeatureDocument | { content?: FeatureItem | FeatureDocument } | null;
  content?: FeatureItem | FeatureDocument;
  _ref?: string;
  _schema?: string;
  _type?: string;
};

type FeatureItem = Omit<Feature, 'icon'> & {
  _id?: string;
  id?: string;
  icon?: unknown;
  headline?: string;
  subheadline?: string;
  href?: string;
  link?: string;
  name?: string;
  is_external_url?: boolean;
  [key: string]: unknown;
} & ResolvedFeatureRecord;

type FeatureReference = {
  _ref: string;
  _schema?: string;
  _type?: string;
  _resolved?: unknown;
  [key: string]: unknown;
};

type FeatureBlockContent = Omit<FeatureSection, 'items' | 'layout'> & {
  headline?: string;
  subtitle?: string;
  subheadline?: string;
  layout?: FeatureLayout;
  layout_variant?: FeatureLayout | string;
  layout_varient?: FeatureLayout | string;
  features?: Array<FeatureItem | FeatureReference>;
  items?: Array<FeatureItem | FeatureReference>;
};

function isExternalUrl(item: FeatureItem) {
  const source = getResolvedItem(item);
  return source.is_external_url === true;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isFeatureReference(value: unknown): value is FeatureReference {
  return (
    isObject(value) &&
    typeof (value as FeatureReference)._ref === 'string' &&
    (value as FeatureReference)._ref.trim().length > 0
  );
}

function resolveFeatureItem(
  item: FeatureItem | FeatureReference,
  featureMap: Map<string, FeatureDocument>
): FeatureItem {
  if (isFeatureReference(item)) {
    const resolved = featureMap.get(item._ref);
    if (resolved) {
      return {
        ...resolved,
        _id: item._ref,
        _resolved: resolved,
      };
    }

    if (
      isObject(item._resolved) &&
      typeof (item._resolved as Record<string, unknown>).title === 'string'
    ) {
      return {
        ...(item._resolved as FeatureItem),
        _id: item._ref,
        _resolved: item._resolved,
      };
    }

    return {
      ...item,
      _id: item._ref,
    } as FeatureItem;
  }

  return item;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function readText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getResolvedItem(item: FeatureItem): FeatureItem | FeatureDocument {
  const resolved = item._resolved;

  if (resolved && typeof resolved === 'object') {
    if ('content' in resolved && resolved.content && typeof resolved.content === 'object') {
      return resolved.content as FeatureItem | FeatureDocument;
    }

    return resolved as FeatureItem | FeatureDocument;
  }

  if (item.content && typeof item.content === 'object') {
    return item.content as FeatureItem | FeatureDocument;
  }

  return item;
}

function readHref(item: FeatureItem) {
  const source = getResolvedItem(item);
  return readText(source.href) ?? readText(source.url) ?? readText(source.link);
}

function getFeatureTitle(item: FeatureItem) {
  const source = getResolvedItem(item);
  return readText(source.title) ?? readText(source.headline) ?? readText(source.name);
}

function getFeatureDescription(item: FeatureItem) {
  const source = getResolvedItem(item);
  return readText(source.description) ?? readText(source.subheadline);
}

function getLayoutVariant(content: FeatureBlockContent): FeatureLayout {
  const layout = content.layout_variant ?? content.layout_varient ?? content.layout;
  return readText(layout)?.toLowerCase() === 'list' ? 'list' : 'grid';
}

function getIconValue(icon: unknown): string | undefined {
  if (typeof icon === 'string') {
    return icon.trim();
  }

  if (!isObject(icon)) {
    return undefined;
  }

  const record = icon as Record<string, unknown>;
  const candidate =
    readText(record.value) ??
    readText(record.name) ??
    readText(record.label) ??
    readText(record.icon) ??
    readText(record.slug);

  if (candidate) {
    return candidate;
  }

  if (isObject(record._resolved)) {
    return getIconValue(record._resolved);
  }

  if (isObject(record.icon)) {
    return getIconValue(record.icon);
  }

  return undefined;
}

function resolveHeroicon(icon: unknown): ElementType<SVGProps<SVGSVGElement>> | null {
  const value = getIconValue(icon);
  if (!value) return null;

  const { style, name } = parseHeroiconValue(value);
  const iconSet = style === 'solid' ? HeroiconsSolid : HeroiconsOutline;
  const resolved = (iconSet as Record<string, unknown>)[toHeroiconExportName(name)];
  return typeof resolved === 'function' || (typeof resolved === 'object' && resolved !== null)
    ? (resolved as ElementType<SVGProps<SVGSVGElement>>)
    : null;
}

function getIconLabel(icon: unknown) {
  const value = getIconValue(icon);
  return value ?? undefined;
}

function FeatureIcon({ icon, title }: Readonly<{ icon: unknown; title: string }>) {
  const heroIcon = resolveHeroicon(icon);
  if (heroIcon) {
    const HeroIconComponent = heroIcon;
    return (
      <HeroIconComponent
        aria-hidden={true}
        className="size-6 stroke-[2] text-[var(--text-muted)]"
      />
    );
  }

  const label = getIconLabel(icon);
  if (!label) {
    return (
      <span
        aria-hidden={true}
        className="flex size-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-muted)]"
      >
        {title.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-[var(--text-muted)]" title={label}>
      {label}
    </span>
  );
}

function FeatureCard({
  item,
  layout,
}: Readonly<{
  item: FeatureItem;
  layout: FeatureLayout;
}>) {
  const title = getFeatureTitle(item);
  const description = getFeatureDescription(item);
  const external = isExternalUrl(item);
  const href = readHref(item);
  const icon = getResolvedItem(item).icon;

  if (!title && !description) {
    return null;
  }

  const cardContent = (
    <>
      {external ? (
        <HeroiconsOutline.ArrowUpRightIcon
          aria-hidden={true}
          className="absolute top-5 right-5 size-3 stroke-[2.5] text-[var(--text-soft)]"
        />
      ) : null}

      {icon ? (
        <div className="mb-5 flex h-6 items-center">
          <FeatureIcon icon={icon} title={title ?? 'Feature'} />
        </div>
      ) : null}

      {title ? (
        <h3 className="text-base font-semibold leading-6 tracking-normal text-[var(--text)]">
          {title}
        </h3>
      ) : null}

      {description ? (
        <p className="mt-1.5 text-base leading-6 text-[var(--text-muted)]">{description}</p>
      ) : null}
    </>
  );

  const className = cn(
    'group relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]',
    description ? 'min-h-[132px]' : 'min-h-[108px]',
    layout === 'list' && 'min-h-0'
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(className, 'block no-underline')}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {cardContent}
      </a>
    );
  }

  return <div className={className}>{cardContent}</div>;
}

export default async function AeoFeatureSection({
  content,
  routeParams,
  language,
}: Readonly<BlockComponentProps<FeatureBlockContent>>) {
  const title = readText(content.title) ?? readText(content.headline);
  const description =
    readText(content.subtitle) ?? readText(content.subheadline) ?? readText(content.description);
  const features = Array.isArray(content.features)
    ? content.features
    : Array.isArray(content.items)
      ? content.items
      : [];
  const layout = getLayoutVariant(content);

  const referencedIds = Array.from(
    new Set(
      features
        .filter(isFeatureReference)
        .map((feature) => feature._ref)
        .filter((ref): ref is string => typeof ref === 'string' && ref.trim().length > 0)
    )
  );

  const featureMap = referencedIds.length > 0 ? await getFeaturesByIds(referencedIds) : new Map();
  const resolvedFeatures = features.map((item) => resolveFeatureItem(item, featureMap));
  const visibleFeatures = resolvedFeatures.filter(
    (item) => getFeatureTitle(item) || getFeatureDescription(item)
  );

  if (!title && !description && visibleFeatures.length === 0) {
    return null;
  }

  return (
    <>
      <DocsPageHeader content={content} routeParams={routeParams} language={language} />
      <DocsPageToc />
      <section
        data-docs-content-block={true}
        className="bg-[var(--background)] px-5 pb-8 font-sans sm:px-8 lg:px-20"
      >
        <div className="mx-auto w-full max-w-[696px] xl:mx-0">
          {title ? (
            <h2 className="scroll-mt-[calc(var(--docs-nav-height)+1.5rem)] text-xl font-bold leading-7 tracking-normal text-[var(--text)]">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-4 max-w-[700px] text-[17px] leading-7 text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}

          {visibleFeatures.length > 0 ? (
            <div
              className={cn(
                'mt-8 grid auto-rows-auto gap-4',
                layout === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'
              )}
            >
              {visibleFeatures.map((item, index) => (
                <FeatureCard
                  key={item._id ?? item.id ?? getFeatureTitle(item) ?? `feature-${index}`}
                  item={item}
                  layout={layout}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
