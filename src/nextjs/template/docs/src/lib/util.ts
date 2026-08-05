/**
 * Asset URL Builder
 *
 * Canonical implementation for building public asset URLs from storage paths.
 * Handles mime type to extension mapping, CDN URL prefixing, and path normalization.
 */

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

function getExtensionFromMimeType(mimeType: string | undefined): string {
  if (!mimeType) return '';
  return MIME_TO_EXTENSION[mimeType] ?? '';
}

function getExtensionFromFilename(filename: string | undefined): string {
  if (!filename) return '';
  const match = filename.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1] ?? '';
}

function hasFileExtension(url: string): boolean {
  const path = (url.split('?')[0] ?? url).trim();
  return /\.[a-z0-9]+$/i.test(path);
}

function isAbsoluteUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url);
}

export interface BuildAssetUrlOptions {
  /** MIME type of the asset (e.g., 'image/png') */
  mimeType?: string;
  /** Original filename, used as fallback for extension detection */
  originalFilename?: string;
}

/**
 * Build a public URL for an asset.
 *
 * @param url - Storage path or URL of the asset
 * @param options - Optional mime type and filename for extension detection
 * @returns Full public URL with CDN prefix and extension, or undefined if no URL provided
 *
 * @example
 * // Basic usage
 * buildAssetUrl('abc123', { mimeType: 'image/png' })
 * // => 'https://cdn.example.com/uploads/abc123.png'
 *
 * @example
 * // Already absolute URL - passthrough
 * buildAssetUrl('https://example.com/image.png')
 * // => 'https://example.com/image.png'
 *
 * @example
 * // SVG handling (correct .svg, not .svg+xml)
 * buildAssetUrl('logo', { mimeType: 'image/svg+xml' })
 * // => 'https://cdn.example.com/uploads/logo.svg'
 */
export function buildAssetUrl(
  url: string | undefined,
  options?: BuildAssetUrlOptions
): string | undefined {
  if (!url) return undefined;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return undefined;

  if (
    isAbsoluteUrl(trimmedUrl) ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('blob:')
  ) {
    return trimmedUrl;
  }

  const ext = hasFileExtension(trimmedUrl)
    ? ''
    : getExtensionFromFilename(options?.originalFilename) ||
      getExtensionFromMimeType(options?.mimeType);

  const urlWithExt = `${trimmedUrl}${ext}`;

  const normalizedPath = urlWithExt.replace(/^\/+/, '');
  const path = urlWithExt.includes('/') ? `/${normalizedPath}` : `/uploads/${normalizedPath}`;

  const cdnBase = process.env.NEXT_PUBLIC_BUNNY_CDN_URL?.trim().replace(/\/+$/, '');
  return cdnBase ? `${cdnBase}${path}` : path;
}

export function parseHeroiconValue(value: string): { style: string; name: string } {
  const [style, ...nameParts] = value.trim().split(':');
  if (nameParts.length === 0) {
    return { style: 'outline', name: style ?? '' };
  }

  return { style: (style ?? 'outline').toLowerCase(), name: nameParts.join(':') };
}

export function toHeroiconExportName(value: string): string {
  const iconName = value.replace(/Icon$/i, '');
  const words = iconName
    .replace(/[-_\s]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean);
  return `${words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('')}Icon`;
}
