import { fetchAllCustomSchemaFields, saveZodSchemaCode } from 'cms-renderer/lib/custom-schemas';
import { cmsConfig } from '../src/lib/cms-config';

async function main() {
  const { cmsUrl, websiteId } = cmsConfig;

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

  await saveZodSchemaCode(
    await fetchAllCustomSchemaFields(cmsConfig),
    './generated/cms-schemas.ts'
  );

  console.log('[generate-schemas] Done.');
}

main().catch((err) => {
  console.error('[generate-schemas] Failed:', err);
  process.exit(1);
});
