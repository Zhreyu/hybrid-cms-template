import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { DocsRefresher } from '@/components/DocsRefresher'
import { cmsConfig } from '@/lib/cms-config'
import appCss from '@/globals.css?url'
import 'cms-renderer/styles/docs-markdown.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'documentation' },
      { name: 'description', content: 'Built with create-profound-app' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {cmsConfig.websiteId ? (
          <DocsRefresher />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
