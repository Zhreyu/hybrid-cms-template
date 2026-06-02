import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDefaultDocsEntry } from '@/lib/default-docs-entry';
import { buildDocsHref } from '@/lib/docs-href';
import {
  DEFAULT_LANGUAGE_CODE,
  DOCS_LANGUAGE_COOKIE_KEY,
  isSupportedLanguageCode,
} from '@/lib/supported-languages';

export default async function Home() {
  const cookieValue = (await cookies()).get(DOCS_LANGUAGE_COOKIE_KEY)?.value;
  const language =
    cookieValue && isSupportedLanguageCode(cookieValue) ? cookieValue : DEFAULT_LANGUAGE_CODE;

  const entry = await getDefaultDocsEntry();
  redirect(buildDocsHref({ language, ...entry }));
}