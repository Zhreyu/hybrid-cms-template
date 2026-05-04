import type { BlockComponentProps } from 'cms-renderer/lib/types';
import Image from 'next/image';
import type { Uifooter } from '@/generated/cms-schemas';
import { GithubIcon, LinkedInIcon, XIcon } from './icons';

export default async function UIFooter({ content }: BlockComponentProps<Uifooter>) {
  const { powered_by, poweredby_url, x_url, github_url, linkedin_url } = content;

  const poweredByAsset = powered_by as
    | { _asset?: { url?: string; mime_type?: string }; alt?: string }
    | undefined;
  const logoAlt = powered_by?.alt;
  const mimeType = poweredByAsset?._asset?.mime_type;
  const ext = mimeType ? `.${mimeType.split('/')[1]}` : '';
  const logoUrl = poweredByAsset?._asset?.url ? `${poweredByAsset._asset.url}${ext}` : undefined;

  const socialLinks = [
    { href: x_url, icon: <XIcon />, label: 'X' },
    { href: github_url, icon: <GithubIcon />, label: 'GitHub' },
    { href: linkedin_url, icon: <LinkedInIcon />, label: 'LinkedIn' },
  ].filter((l) => l.href);

  return (
    <footer className="border-t border-[#1f1f1f] bg-[#0d0d0d] px-4 pt-6 pb-16 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mx-0 lg:pl-4">
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-5">
            {socialLinks.map(({ href, icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-[#6b7280] transition-colors hover:text-[#d1d5db]"
              >
                {icon}
              </a>
            ))}
          </div>
        )}
        <a
          href={poweredby_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline opacity-60 transition-opacity hover:opacity-100 sm:ml-auto"
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b7280]">Powered By</span>
          {logoUrl ? (
            <Image
              src={`https://cms-profound.b-cdn.net/uploads/${logoUrl}`}
              alt={logoAlt ?? ''}
              width={95}
              height={20}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          ) : (
            <span className="text-[#4b5563] text-xs">{logoAlt}</span>
          )}
        </a>
      </div>
    </footer>
  );
}
