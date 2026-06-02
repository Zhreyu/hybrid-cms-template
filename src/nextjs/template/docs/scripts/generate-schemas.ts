import { fetchAllCustomSchemaFields, saveZodSchemaCode } from 'cms-renderer/lib/custom-schemas';
import { cmsConfig } from '../src/lib/cms-config';

async function main() {
  const { cmsUrl, websiteId, apiKey } = cmsConfig;

  if (!cmsUrl) {
    throw new Error(
      '[generate-schemas] NEXT_PUBLIC_CMS_API_URL is not set. Set it in your environment or .env file.'
    );
  }
  if (!websiteId) {
    throw new Error(
      '[generate-schemas] NEXT_PUBLIC_PROFOUND_WEBSITE_ID is not set. Set it in your environment or .env file.'
    );
  }
  if (!apiKey) {
    throw new Error(
      '[generate-schemas] PROFOUND_API_KEY is not set. Set it in your environment or .env file.'
    );
  }

  const schemas = await fetchAllCustomSchemaFields({ cmsUrl, websiteId, apiKey });

  if (schemas.length === 0) {
    throw new Error(
      '[generate-schemas] No schemas returned from API. Check that PROFOUND_API_KEY is valid and the CMS server has SUPABASE_SERVICE_ROLE_KEY set.'
    );
  }

  console.log(
    `[generate-schemas] Found ${schemas.length} schemas: ${schemas.map((s) => s.name).join(', ')}`
  );

  await saveZodSchemaCode(schemas, './src/generated/cms-schemas.ts');

  console.log('[generate-schemas] Done.');
}

main().catch((err) => {
  console.error('[generate-schemas] Failed:', err);
  process.exit(1);
});
