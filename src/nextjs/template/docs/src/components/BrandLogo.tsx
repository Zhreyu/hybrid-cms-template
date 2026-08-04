'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme-provider';
import { buildAssetUrl } from '@/lib/util';

export interface BrandLogoData {
  iconUrl?: string;
  iconLightUrl?: string;
  iconDarkUrl?: string;
  iconAlt: string;
  logoText: string;
}

type BrandLogoSource = {
  icon?: unknown;
  logo_text?: string;
  [key: string]: unknown;
};

function readImageReference(value: unknown): {
  url?: string;
  alt?: string;
  mimeType?: string;
} {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const image = value as { _asset?: { url?: unknown; mime_type?: unknown }; alt?: unknown };
  const assetUrl = typeof image._asset?.url === 'string' ? image._asset.url : undefined;
  const mimeType = typeof image._asset?.mime_type === 'string' ? image._asset.mime_type : undefined;
  const alt = typeof image.alt === 'string' ? image.alt : undefined;

  return {
    ...(assetUrl ? { url: assetUrl } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(alt ? { alt } : {}),
  };
}

function readLogoVariant(content: BrandLogoSource, keys: string[]): string | undefined {
  for (const key of keys) {
    const image = readImageReference(content[key]);
    const url = buildAssetUrl(image.url, { mimeType: image.mimeType });
    if (url) return url;
  }

  return undefined;
}

export function resolveBrandLogo(content: BrandLogoSource): BrandLogoData {
  const icon = readImageReference(content.icon);
  const logoText =
    typeof content.logo_text === 'string' && content.logo_text.trim().length > 0
      ? content.logo_text
      : '';

  const iconUrl = buildAssetUrl(icon.url, {
    mimeType: icon.mimeType,
  });
  const iconLightUrl = readLogoVariant(content, ['icon_light', 'logo_light', 'light_icon']);
  const iconDarkUrl = readLogoVariant(content, ['icon_dark', 'logo_dark', 'dark_icon']);

  return {
    ...(iconUrl ? { iconUrl } : {}),
    ...(iconLightUrl ? { iconLightUrl } : {}),
    ...(iconDarkUrl ? { iconDarkUrl } : {}),
    iconAlt: icon.alt ?? 'logo',
    logoText,
  };
}

export function BrandLogo({ brand }: { brand: BrandLogoData }) {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 shrink items-center gap-2 no-underline"
    >
      <BrandLogoImage brand={brand} width={95} height={20} />
      <span className="truncate text-[16px] font-semibold tracking-normal text-[var(--text)]">
        {brand.logoText}
      </span>
    </a>
  );
}

function BrandLogoImage({
  brand,
  width,
  height,
  className = 'object-contain',
}: {
  brand: BrandLogoData;
  width: number;
  height: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const themedIconUrl =
    resolvedTheme === 'dark'
      ? (brand.iconLightUrl ?? brand.iconUrl)
      : (brand.iconDarkUrl ?? brand.iconUrl);

  if (!themedIconUrl) return null;

  return (
    <Image
      src={themedIconUrl}
      alt={brand.iconAlt}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function CmsThemeLogoImage({
  source,
  width,
  height,
  className,
}: {
  source: BrandLogoSource;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <BrandLogoImage
      brand={resolveBrandLogo(source)}
      width={width}
      height={height}
      className={className}
    />
  );
}
