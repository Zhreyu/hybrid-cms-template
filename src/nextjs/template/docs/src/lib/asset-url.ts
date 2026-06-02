export interface BuildAssetUrlOptions {
  mimeType?: string;
}

export function buildAssetUrl(
  url?: string,
  options: BuildAssetUrlOptions = {}
): string | undefined {
  if (!url) return undefined;

  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const ext = options.mimeType ? `.${options.mimeType.split('/')[1]}` : '';
  const urlWithExt = `${url}${/\.[a-z0-9]+$/i.test(url) ? '' : ext}`;
  const normalizedPath = urlWithExt.replace(/^\/+/, '');
  const path = urlWithExt.startsWith('/')
    ? `/${normalizedPath}`
    : urlWithExt.includes('/')
      ? `/${normalizedPath}`
      : `/uploads/${normalizedPath}`;

  const cdnBase = process.env.NEXT_PUBLIC_BUNNY_CDN_URL?.trim().replace(/\/+$/, '');
  return cdnBase ? `${cdnBase}${path}` : path;
}
