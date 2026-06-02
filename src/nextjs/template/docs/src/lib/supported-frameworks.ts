export const DOCS_FRAMEWORK_STORAGE_KEY = 'docs_framework';
export const DOCS_FRAMEWORK_COOKIE_KEY = 'docs_framework';

export type FrameworkId = 'nextjs' | 'react' | 'vue' | 'tanstack';

export interface SupportedFramework {
  id: FrameworkId;
  label: string;
  /** When false, choosing this option routes to the coming-soon page (Phase 1). */
  enabled: boolean;
}

/** Next.js is the primary target; other entries prime the UI for future docs. */
export const SUPPORTED_FRAMEWORKS: SupportedFramework[] = [
  { id: 'nextjs', label: 'Next.js', enabled: true },
  { id: 'react', label: 'React', enabled: false },
  { id: 'vue', label: 'Vue', enabled: false },
  { id: 'tanstack', label: 'TanStack', enabled: false },
];

export const DEFAULT_FRAMEWORK_ID: FrameworkId = 'nextjs';

export function isFrameworkId(value: string | null | undefined): value is FrameworkId {
  return SUPPORTED_FRAMEWORKS.some((f) => f.id === value);
}

export function getFrameworkById(id: FrameworkId): SupportedFramework | undefined {
  return SUPPORTED_FRAMEWORKS.find((f) => f.id === id);
}
