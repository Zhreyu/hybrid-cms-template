import type { BlockComponentProps, Reference } from 'cms-renderer/lib/types';
import type { FaqAccordion } from '@/generated/cms-schemas';
import type { FaqItemDocument } from '@/lib/cms-data';
import { getFaqItemsByIds } from '@/lib/cms-data';
import { DocsMarkdown } from './DocsMarkdown';
import { DocsPageHeader, DocsPageToc } from './DocsPageChrome';

type FaqItemReference = Reference & {
  _resolved?: FaqItemDocument | { content?: FaqItemDocument } | null;
};

type InlineFaqItem = FaqItemDocument & {
  _ref?: string;
  _resolved?: FaqItemDocument | { content?: FaqItemDocument } | null;
};

type FaqAccordionContent = Omit<FaqAccordion, 'items'> & {
  items?: Array<FaqItemReference | InlineFaqItem>;
};

type NormalizedFaqItem = {
  id: string;
  question: string;
  answer: string;
  defaultOpen: boolean;
  ordering: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOrdering(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function getResolvedContent(item: FaqItemReference | InlineFaqItem): FaqItemDocument | null {
  if (isObject(item._resolved)) {
    if (isObject(item._resolved.content)) {
      return item._resolved.content as FaqItemDocument;
    }

    return item._resolved as FaqItemDocument;
  }

  if ('question' in item || 'answer' in item) {
    return item as FaqItemDocument;
  }

  return null;
}

function getReferenceIds(items: Array<FaqItemReference | InlineFaqItem>): string[] {
  return [
    ...new Set(
      items.map((item) => readString(item._ref)).filter((id): id is string => id.length > 0)
    ),
  ];
}

function normalizeFaqItem(
  item: FaqItemReference | InlineFaqItem,
  faqItemsById: Map<string, FaqItemDocument>
): NormalizedFaqItem | null {
  const refId = readString(item._ref);
  const source = (refId ? faqItemsById.get(refId) : null) ?? getResolvedContent(item);
  const question = readString(source?.question ?? source?._title);

  if (!question) {
    return null;
  }

  return {
    id: refId || readString(source?._id) || question,
    question,
    answer: readString(source?.answer),
    defaultOpen: source?.default_open === true,
    ordering: readOrdering(source?.ordering),
  };
}

function getWidthClass(maxWidth: unknown) {
  return readString(maxWidth) === 'wide' ? 'max-w-[920px]' : 'max-w-[720px]';
}

export default async function FAQAccordion({
  content,
  routeParams,
  language,
}: BlockComponentProps<FaqAccordionContent>) {
  const items = Array.isArray(content.items) ? content.items : [];
  const faqItemsById = await getFaqItemsByIds(getReferenceIds(items), language);
  const normalizedItems = items
    .map((item) => normalizeFaqItem(item, faqItemsById))
    .filter((item): item is NormalizedFaqItem => item !== null)
    .sort((left, right) => {
      const orderDiff = left.ordering - right.ordering;
      if (orderDiff !== 0) return orderDiff;

      return left.question.localeCompare(right.question);
    });

  if (normalizedItems.length === 0) {
    return null;
  }

  const title = readString(content.title);
  const description = readString(content.description);

  return (
    <>
      <DocsPageHeader content={content} routeParams={routeParams} language={language} />
      <DocsPageToc />
      <section
        data-docs-content-block={true}
        className="bg-[var(--background)] px-5 py-8 sm:px-8 lg:px-20"
      >
        <div className={`mx-auto w-full ${getWidthClass(content.max_width)} xl:mx-0`}>
          {title || description ? (
            <div className="mb-5">
              {title ? (
                <h2
                  data-docs-toc-heading={true}
                  className="scroll-mt-[calc(var(--docs-nav-height)+1.5rem)] text-2xl font-semibold leading-tight tracking-normal text-[var(--text)]"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-2 text-base leading-7 text-[var(--text-muted)]">{description}</p>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            {normalizedItems.map((item) => (
              <details
                key={item.id}
                open={item.defaultOpen}
                className="group/faq border-b border-[var(--border)] last:border-b-0"
              >
                <summary className="grid cursor-pointer list-none grid-cols-[12px_minmax(0,1fr)] items-start gap-4 px-5 py-5 text-left marker:hidden sm:px-7 sm:py-6 [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden={true}
                    className="mt-[0.55rem] h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[var(--text-muted)] transition-transform duration-150 group-open/faq:rotate-90"
                  />
                  <span className="break-words font-medium leading-[1.28] tracking-normal text-[var(--text)]">
                    {item.question}
                  </span>
                </summary>

                {item.answer ? (
                  <div className="px-5 pb-8 text-[2px] leading-[1.75] text-[var(--text-muted)] sm:px-7">
                    <DocsMarkdown content={item.answer} />
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
