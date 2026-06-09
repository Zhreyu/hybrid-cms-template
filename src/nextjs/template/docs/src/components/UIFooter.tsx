import type { BlockComponentProps } from 'cms-renderer/lib/types';
import Image from 'next/image';
import type { Uifooter } from '@/generated/cms-schemas';
import { buildAssetUrl } from '@/lib/asset-url';
import { GithubIcon, LinkedInIcon, XIcon } from './icons';

export default async function UIFooter({ content }: BlockComponentProps<Uifooter>) {
  const { powered_by, poweredby_url, x_url, github_url, linkedin_url } = content;
  const statusPageUrl =
    'status_page_url' in content && typeof content.status_page_url === 'string'
      ? content.status_page_url
      : undefined;

  const poweredByAsset = powered_by as
    | { _asset?: { url?: string; mime_type?: string }; alt?: string }
    | undefined;
  const logoAlt = powered_by?.alt;
  const logoUrl = buildAssetUrl(poweredByAsset?._asset?.url, {
    mimeType: poweredByAsset?._asset?.mime_type,
  });

  const socialLinks = [
    { href: x_url, icon: <XIcon />, label: 'X' },
    { href: github_url, icon: <GithubIcon />, label: 'GitHub' },
    { href: linkedin_url, icon: <LinkedInIcon />, label: 'LinkedIn' },
  ].filter((l) => l.href);

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] text-[var(--text)] px-4 pt-6 pb-16 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mx-0 lg:pl-4">
        <div className="flex items-center gap-5">
          {socialLinks.map(({ href, icon, label }) => (
            <a
              key={label}
              href={href}
              title={`Visit our ${label} profile`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              {icon}
            </a>
          ))}
          {statusPageUrl && (
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View status page"
              className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text)]"
            >
              <span aria-hidden="true" className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All Systems Operational
            </a>
          )}
        </div>
        <a
          href={poweredby_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          title="Visit our powered by profile"
          className="flex items-center gap-2 no-underline opacity-60 transition-opacity hover:opacity-100 sm:ml-auto"
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Powered By
          </span>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt ?? ''}
              width={95}
              height={20}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          ) : (
            <span className="text-[var(--text-soft)] text-xs">{logoAlt}</span>
          )}
        </a>
      </div>
    </footer>
  );
}
