export function normalizeRouteSegment(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getRouteSegment(document: Record<string, unknown>, field: string): string {
  const code = document.code;
  if (typeof code === 'string' && code.length > 0) return code;

  const primaryValue = document[field];
  if (typeof primaryValue === 'string' && primaryValue.length > 0) {
    return normalizeRouteSegment(primaryValue);
  }

  const fallbackTitle = document._title;
  if (typeof fallbackTitle === 'string' && fallbackTitle.length > 0) {
    return normalizeRouteSegment(fallbackTitle);
  }

  return '';
}
