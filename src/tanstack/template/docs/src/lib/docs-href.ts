interface BuildDocsHrefOptions {
  language?: string;
  category: string;
  post: string;
}

export function buildDocsHref({ language, category, post }: BuildDocsHrefOptions): string {
  const prefix = language ? `/${language}` : '';
  return `${prefix}/${category}/${post}`;
}
