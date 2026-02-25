import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { Refresher } from "cms-renderer/lib/refresher";

export const metadata: Metadata = {
  title: "{{PROJECT_NAME}}",
  description: "Built with create-profound-next",
};

async function revalidate() {
  "use server";
  revalidatePath("/", "layout");
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Refresher
          websiteId={process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID ?? ""}
          cmsUrl={
            process.env.NEXT_PUBLIC_PROFOUND_CMS_URL ??
            "https://cms.dev.tryprofound.com"
          }
          apiKey={process.env.PROFOUND_API_KEY ?? ""}
          onInvalidate={revalidate}
        />
      </body>
    </html>
  );
}
