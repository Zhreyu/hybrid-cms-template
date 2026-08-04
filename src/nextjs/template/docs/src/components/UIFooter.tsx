import type { BlockComponentProps } from 'cms-renderer/lib/types';
import type { Uifooter } from '@/generated/cms-schemas';
import { showsLanguageDropdown } from '@/lib/docs-route';
import { CmsThemeLogoImage } from './BrandLogo';
import { ContinueReading } from './ContinueReading';
import { GithubIcon, LinkedInIcon, XIcon } from './icons';
import { LanguageDropdown } from './LanguageDropdown';
import { ThemeMenu } from './ThemeMenu';

type UIFooterContent = Uifooter & {
  powered_by?: unknown;
  status_page_url?: string;
  logo_light?: unknown;
  logo_dark?: unknown;
  [key: string]: unknown;
};

export default async function UIFooter({
  content,
  routeParams,
  language,
}: BlockComponentProps<UIFooterContent>) {
  const showLanguageDropdown = showsLanguageDropdown(routeParams);
  const {
    powered_by,
    powered_by_light,
    powered_by_dark,
    logo_light,
    logo_dark,
    poweredby_url,
    x_url,
    github_url,
    linkedin_url,
    status_page_url,
  } = content;

  const logoAlt =
    powered_by && typeof powered_by === 'object' && 'alt' in powered_by
      ? String(powered_by.alt ?? '')
      : '';

  const socialLinks = [
    { href: x_url, icon: <XIcon />, label: 'X' },
    { href: github_url, icon: <GithubIcon />, label: 'GitHub' },
    { href: linkedin_url, icon: <LinkedInIcon />, label: 'LinkedIn' },
  ].filter((l) => l.href);

  return (
    <>
      <ContinueReading routeParams={routeParams} language={language} />
      <footer className="border-t border-[var(--border)] bg-[var(--background)] px-4 pt-8 pb-16 font-sans text-[var(--text)] sm:px-6 lg:px-12">
        <div className="mx-auto flex w-full max-w-[48rem] flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left lg:mx-0 lg:pl-4">
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

            {status_page_url && (
              <a
                href={status_page_url}
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

            <CmsThemeLogoImage
              source={{
                icon: powered_by,
                icon_light: powered_by_light ?? logo_light,
                icon_dark: powered_by_dark ?? logo_dark,
              }}
              width={95}
              height={20}
              className="object-contain"
            />
            {!powered_by && logoAlt ? (
              <span className="text-xs text-[var(--text-soft)]">{logoAlt}</span>
            ) : null}
          </a>

          <div className="flex items-center justify-center gap-4">
            <LanguageDropdown showLanguageDropdown={showLanguageDropdown} />
            <div className="md:hidden lg:hidden">
              <ThemeMenu />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
