const sidebarItems = ['a', 'b', 'c', 'd', 'e', 'f'];

function TopBarSkeleton() {
  return (
    <div className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 shrink items-center gap-2">
          <div className="h-5 w-5 rounded bg-[#141414]" />
          <div className="h-4 w-24 rounded-full bg-[#141414]" />
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="h-9 w-full max-w-[480px] rounded-lg border border-[#1f1f1f] bg-[#121212]" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden h-9 w-28 rounded-full border border-[#1f1f1f] bg-[#121212] sm:block" />
          <div className="h-8 w-8 rounded-full bg-[#141414]" />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="border-b border-[#1f1f1f] bg-[#0d0d0d] lg:border-b-0 lg:border-r">
      <div className="px-4 py-4 lg:px-4 lg:py-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded-full bg-[#171717]" />
            <div className="space-y-2">
              {sidebarItems.slice(0, 3).map((item) => (
                <div key={item} className="h-4 w-full rounded-md bg-[#121212]" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-3 w-20 rounded-full bg-[#171717]" />
            <div className="space-y-2">
              {sidebarItems.slice(3).map((item) => (
                <div key={item} className="h-4 w-full rounded-md bg-[#121212]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ContentSkeleton() {
  return (
    <div className="min-w-0 bg-[#0d0d0d] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto min-w-0 max-w-[48rem] lg:mx-0 lg:pl-4">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-28 rounded-full bg-[#171717]" />
          <div className="h-10 w-72 max-w-full rounded-full bg-[#141414]" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-[#131313]" />
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#101010] p-4">
            <div className="mb-4 h-3 w-24 rounded-full bg-[#171717]" />
            <div className="space-y-2">
              <div className="h-5 w-full rounded-full bg-[#151515]" />
              <div className="h-5 w-11/12 rounded-full bg-[#131313]" />
              <div className="h-5 w-10/12 rounded-full bg-[#131313]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#1a1a1a] bg-[#101010] p-4">
            <div className="mb-4 h-3 w-32 rounded-full bg-[#171717]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-[#151515]" />
              <div className="h-4 w-10/12 rounded-full bg-[#131313]" />
              <div className="h-4 w-11/12 rounded-full bg-[#131313]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#1a1a1a] bg-[#101010] p-4">
            <div className="mb-4 h-3 w-28 rounded-full bg-[#171717]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-[#151515]" />
              <div className="h-4 w-9/12 rounded-full bg-[#131313]" />
              <div className="h-4 w-8/12 rounded-full bg-[#131313]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <footer className="border-t border-[#1f1f1f] bg-[#0d0d0d] px-4 pt-6 pb-16 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mx-0 lg:pl-4">
        <div className="flex items-center gap-5">
          <div className="h-4 w-4 rounded-full bg-[#141414]" />
          <div className="h-4 w-4 rounded-full bg-[#141414]" />
          <div className="h-4 w-4 rounded-full bg-[#141414]" />
        </div>

        <div className="flex items-center gap-2 opacity-60 sm:ml-auto">
          <div className="h-3 w-16 rounded-full bg-[#141414]" />
          <div className="h-4 w-24 rounded-full bg-[#141414]" />
        </div>
      </div>
    </footer>
  );
}
export default function Loading() {
  return (
    <section className="min-h-screen bg-[#0d0d0d] text-[#f3f4f6]">
      <TopBarSkeleton />

      <div className="mx-auto grid w-full max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <SidebarSkeleton />
        <ContentSkeleton />
      </div>
      <FooterSkeleton />
    </section>
  );
}
