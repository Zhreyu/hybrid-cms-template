export function normalizeTitle(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase()
    .replace(/(^|[\s'’(])\p{L}/gu, (char) => char.toLocaleUpperCase());
}
