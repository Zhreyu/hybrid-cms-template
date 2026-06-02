import { normalizeTitle } from './normalize-title';
import { normalizeRouteSegment } from './route-segment';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Docs title rendering currently has to reconcile an weird schema shape:
 * - `_title` is the source document title
 * - `title` is often used as the route slug in translated content
 * - `code` is also route-oriented
 *
 * Because translated documents do not currently provide a real dedicated localized
 * display-title field, the docs UI applies heuristics to choose a visible title.
 *
 * TODO: Follow-up refactor:
 * - introduce a clear localized display-title field, or
 * - make `_title` translation-aware
 *
 * That would let docs consumers stop guessing between `_title`, `title`, and `code`.
 */

function isRouteLikeTitle(value: string): boolean {
  return normalizeRouteSegment(value) === value;
}

function formatDisplayTitle(value: string): string {
  if (isRouteLikeTitle(value)) {
    return normalizeTitle(value);
  }

  const hasUppercase = /\p{Lu}/u.test(value);
  if (hasUppercase) {
    return value;
  }

  return value.replace(/\p{L}/u, (char) => char.toLocaleUpperCase());
}

export function getDisplayTitle(document: Record<string, unknown>, fieldName = 'title'): string {
  const fieldValue = readString(document[fieldName]);
  const fallbackTitle = readString(document._title);

  if (fieldValue && !isRouteLikeTitle(fieldValue)) {
    return formatDisplayTitle(fieldValue);
  }

  if (fallbackTitle) {
    return fallbackTitle;
  }

  if (fieldValue) {
    return formatDisplayTitle(fieldValue);
  }

  return '';
}

export function getLocalizedDisplayTitle(
  sourceDocument: Record<string, unknown>,
  translatedDocument: Record<string, unknown>,
  fieldName = 'title'
): string {
  const translatedFieldValue = readString(translatedDocument[fieldName]);
  if (translatedFieldValue) {
    return formatDisplayTitle(translatedFieldValue);
  }

  return getDisplayTitle(sourceDocument, fieldName);
}
