import { ImageResponse } from 'next/og';
import { DEFAULT_DOCS_DESCRIPTION, getDocsRouteMetadata, SITE_NAME } from '@/lib/docs-metadata';

export const runtime = 'edge';

const size = {
  width: 1200,
  height: 630,
};

function normalizePath(value: string | null): string {
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = normalizePath(searchParams.get('path'));
  const metadata = await getDocsRouteMetadata(path);
  const sectionLabel = metadata.sectionLabel || SITE_NAME;
  const title = metadata.title || SITE_NAME;
  const description = metadata.description || DEFAULT_DOCS_DESCRIPTION;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#111111',
        color: '#f7f7f7',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 64,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #2f3137',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #171717 0%, #202124 58%, #303033 100%)',
          padding: 54,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              background: '#f7f7f7',
              color: '#111111',
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            ◆
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              marginBottom: 24,
              color: '#b3bac7',
              fontSize: 32,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {sectionLabel}
          </div>
          <div
            style={{
              maxWidth: 900,
              fontSize: title.length > 42 ? 58 : 72,
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            {title}
          </div>
          <div
            style={{
              maxWidth: 920,
              marginTop: 28,
              color: '#cdd2dc',
              fontSize: 34,
              lineHeight: 1.35,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
