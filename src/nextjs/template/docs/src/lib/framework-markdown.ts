import { DEFAULT_FRAMEWORK_ID, type FrameworkId } from './supported-frameworks';

function normalizeFrameworkToken(token: string): string {
  const value = token.trim().toLowerCase();
  if (!value) return value;
  if (value === 'next') return 'nextjs';
  if (value === 'next.js') return 'nextjs';
  if (value === 'vuejs') return 'vue';
  if (value === 'reactjs') return 'react';
  return value;
}

function parseFrameworkList(value: string): string[] {
  return value
    .split(/[,\s]+/g)
    .map((v) => normalizeFrameworkToken(v))
    .filter(Boolean);
}

const FRAMEWORK_FENCE_OPEN = /^:::\s*framework\s+(.+)\s*$/i;

/** Parsed framework list from an opening fence line, or null if the line is not an opener. */
function matchFrameworkFenceOpen(line: string): string[] | null {
  const m = line.match(FRAMEWORK_FENCE_OPEN);
  if (!m) return null;
  return parseFrameworkList(m[1] ?? '');
}

/**
 * Filters markdown sections wrapped in:
 *
 * :::framework nextjs
 * content...
 * :::
 *
 * You can list multiple frameworks: `:::framework nextjs vue`
 * Special-case: `all` always renders.
 */
export function filterMarkdownByFramework(
  markdown: string,
  framework: FrameworkId = DEFAULT_FRAMEWORK_ID
): string {
  if (!markdown) return markdown;

  const normalizedFramework = normalizeFrameworkToken(framework);
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];

  let inBlock = false;
  let renderBlock = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    const openFrameworks = matchFrameworkFenceOpen(line);
    if (openFrameworks !== null) {
      // New opener: applies both outside a block and when a prior block was left
      // unclosed (consecutive `::: framework` without a closing `:::`).
      inBlock = true;
      renderBlock = openFrameworks.includes('all') || openFrameworks.includes(normalizedFramework);
      continue;
    }

    if (!inBlock) {
      out.push(line);
      continue;
    }

    if (/^:::\s*$/.test(line)) {
      inBlock = false;
      renderBlock = true;
      continue;
    }

    if (renderBlock) out.push(line);
  }

  // If a block was unterminated, we still return best-effort output.
  return out.join('\n');
}
