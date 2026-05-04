import type { SearchEntry } from './search-index';

interface PreparedSearchEntry {
  entry: SearchEntry;
  title: string;
  category: string;
  headings: string;
  content: string;
}

const preparedEntriesCache = new WeakMap<SearchEntry, PreparedSearchEntry>();

function getPreparedEntry(entry: SearchEntry): PreparedSearchEntry {
  const cached = preparedEntriesCache.get(entry);
  if (cached) return cached;

  const preparedEntry = {
    entry,
    title: entry.title.toLowerCase(),
    category: entry.category.toLowerCase(),
    headings: entry.headings.join(' ').toLowerCase(),
    content: entry.content.toLowerCase(),
  };

  preparedEntriesCache.set(entry, preparedEntry);
  return preparedEntry;
}

export function getSearchResults(entries: SearchEntry[], query: string): SearchEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return entries.slice(0, 8);

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return entries
    .map((entry) => {
      const preparedEntry = getPreparedEntry(entry);
      const { title, category, headings, content } = preparedEntry;

      let score = 0;

      if (title.includes(normalizedQuery)) score += 120;
      if (headings.includes(normalizedQuery)) score += 80;
      if (category.includes(normalizedQuery)) score += 40;
      if (content.includes(normalizedQuery)) score += 20;

      for (const token of tokens) {
        if (title.includes(token)) score += 24;
        if (headings.includes(token)) score += 16;
        if (category.includes(token)) score += 8;
        if (content.includes(token)) score += 4;
      }

      return { entry, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((result) => result.entry);
}

export function buildSnippet(entry: SearchEntry, query: string): string {
  if (!query.trim()) {
    return entry.headings[0] ?? entry.content.slice(0, 140);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const haystack = `${entry.headings.join(' ')} ${entry.content}`.trim();
  const lowered = haystack.toLowerCase();
  const matchIndex = lowered.indexOf(normalizedQuery);

  if (matchIndex === -1) return haystack.slice(0, 140);

  const start = Math.max(0, matchIndex - 50);
  const end = Math.min(haystack.length, matchIndex + normalizedQuery.length + 90);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < haystack.length ? '…' : '';
  return `${prefix}${haystack.slice(start, end).trim()}${suffix}`;
}
