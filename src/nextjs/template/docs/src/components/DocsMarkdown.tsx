import {
  BeakerIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { DocsMarkdown as RendererDocsMarkdown } from 'cms-renderer/lib/docs-markdown';
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ClickableImage } from './ClickableImage';
import { CopyCodeButton } from './CopyCodeButton';

type CalloutVariant = 'info' | 'warning' | 'error' | 'note' | 'tip';
type CalloutKind =
  | 'info'
  | 'tip'
  | 'note'
  | 'warning'
  | 'warn'
  | 'beta'
  | 'caution'
  | 'error'
  | 'unavailable'
  | null;

const CALLOUT_MARKER_PATTERN =
  /^\s*!?\[(info|tip|note|warning|warn|beta|caution|error|unavailable)\]\s*/i;

function ExclamationOctagonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden={true}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return '';
}

function getExplicitCalloutKind(children: ReactNode): CalloutKind | null {
  const marker = getTextContent(children).match(CALLOUT_MARKER_PATTERN)?.[1]?.toLowerCase();

  if (
    marker !== 'info' &&
    marker !== 'tip' &&
    marker !== 'note' &&
    marker !== 'warning' &&
    marker !== 'warn' &&
    marker !== 'beta' &&
    marker !== 'caution' &&
    marker !== 'error' &&
    marker !== 'unavailable'
  ) {
    return null;
  }

  return marker;
}

function getCalloutVariant(kind: CalloutKind): CalloutVariant {
  if (kind === 'info') {
    return 'info';
  }

  if (kind === 'error' || kind === 'unavailable') {
    return 'error';
  }

  if (kind === 'tip') {
    return 'tip';
  }

  if (kind === 'note') {
    return 'note';
  }

  return 'warning';
}

function getCalloutKind(kind: CalloutKind | null, variant: CalloutVariant): CalloutKind {
  if (kind) {
    return kind;
  }

  return variant;
}

function getCalloutIcon(kind: CalloutKind) {
  if (kind === 'info') {
    return <InformationCircleIcon aria-hidden={true} className="cms-docs-callout-icon" />;
  }

  if (kind === 'tip') {
    return <LightBulbIcon aria-hidden={true} className="cms-docs-callout-icon" />;
  }

  if (kind === 'note') {
    return <CheckIcon aria-hidden={true} className="cms-docs-callout-icon" />;
  }

  if (kind === 'beta') {
    return <BeakerIcon aria-hidden={true} className="cms-docs-callout-icon" />;
  }

  if (kind === 'error' || kind === 'unavailable') {
    return <ExclamationOctagonIcon aria-hidden={true} className="cms-docs-callout-icon" />;
  }

  return <ExclamationTriangleIcon aria-hidden={true} className="cms-docs-callout-icon" />;
}

function stripCalloutMarker(node: ReactNode, markerWasRemoved: { current: boolean }): ReactNode {
  if (markerWasRemoved.current) {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child) => stripCalloutMarker(child, markerWasRemoved));
  }

  if (typeof node === 'string') {
    const stripped = node.replace(CALLOUT_MARKER_PATTERN, '');
    markerWasRemoved.current = stripped !== node;
    return stripped;
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return node;
  }

  const children = Children.map(node.props.children, (child) =>
    stripCalloutMarker(child, markerWasRemoved)
  );
  return cloneElement(node, undefined, children);
}

type MarkdownElement = ReactElement<{
  children?: ReactNode;
  className?: string;
  start?: number | string;
}>;

function isFragmentElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment;
}

function isListItemElement(
  node: ReactNode
): node is ReactElement<{ children?: ReactNode; className?: string }> {
  return isValidElement<{ children?: ReactNode; className?: string }>(node) && node.type === 'li';
}

function hasClassName(
  node: ReactNode,
  className: string
): node is ReactElement<{
  children?: ReactNode;
  className?: string;
}> {
  return (
    isValidElement<{ children?: ReactNode; className?: string }>(node) &&
    typeof node.props.className === 'string' &&
    node.props.className.split(/\s+/).includes(className)
  );
}

function withStableKey(node: ReactNode, key: string): ReactNode {
  if (isValidElement(node)) {
    return cloneElement(node, { key });
  }

  return <Fragment key={key}>{node}</Fragment>;
}

function isStepListElement(node: ReactNode): node is MarkdownElement {
  return (
    isValidElement<{ children?: ReactNode; className?: string }>(node) &&
    node.type === 'ol' &&
    hasClassName(node, 'cms-docs-step-list')
  );
}

function getFirstContentChild(children: ReactNode): {
  child: ReactNode;
  childArray: ReactNode[];
  index: number;
} | null {
  const childArray = Children.toArray(children);
  const firstContentIndex = childArray.findIndex((child) => getTextContent(child).trim() !== '');

  if (firstContentIndex === -1) {
    return null;
  }

  const child = childArray[firstContentIndex];
  return child ? { child, childArray, index: firstContentIndex } : null;
}

function getLeadingStepNumber(children: ReactNode): number | null {
  const firstContent = getFirstContentChild(children)?.child;

  if (!firstContent) {
    return null;
  }

  const match = getTextContent(firstContent)
    .trim()
    .match(/^Step\s+(\d+)\s*$/i);

  if (!match?.[1]) {
    return null;
  }

  const stepNumber = Number(match[1]);
  return Number.isFinite(stepNumber) ? stepNumber : null;
}

function stripLeadingStepTitle(children: ReactNode): ReactNode {
  const firstContent = getFirstContentChild(children);

  if (!firstContent || getLeadingStepNumber(children) === null) {
    return children;
  }

  return firstContent.childArray.filter((_, index) => index !== firstContent.index);
}

function enhanceStepItem(
  child: ReactElement<{ children?: ReactNode; className?: string }>,
  stepNumber: number
) {
  const contentChildren = Children.toArray(stripLeadingStepTitle(child.props.children)).map(
    (contentChild, index) => withStableKey(contentChild, `cms-step-${stepNumber}-content-${index}`)
  );

  return cloneElement(
    child,
    {
      key: `cms-step-item-${stepNumber}`,
      className: ['cms-docs-step-item', child.props.className].filter(Boolean).join(' '),
    },
    [
      <span key={`cms-step-${stepNumber}-marker`} className="cms-docs-step-marker">
        {stepNumber}
      </span>,
      <div key={`cms-step-${stepNumber}-body`} className="cms-docs-step-body">
        <div className="cms-docs-step-title">Step {stepNumber}</div>
        <div className="cms-docs-step-content">{contentChildren}</div>
      </div>,
    ]
  );
}

function enhanceOrderedListChild(child: ReactNode, stepNumber: number): ReactNode {
  if (isListItemElement(child)) {
    return enhanceStepItem(child, stepNumber);
  }

  if (!isFragmentElement(child)) {
    return child;
  }

  const fragmentChildren = Children.toArray(child.props.children);
  const listItemIndex = fragmentChildren.findIndex(isListItemElement);

  if (listItemIndex === -1) {
    return child;
  }

  const enhancedChildren = fragmentChildren.map((fragmentChild, index) =>
    index === listItemIndex && isListItemElement(fragmentChild)
      ? enhanceStepItem(fragmentChild, stepNumber)
      : fragmentChild
  );

  return cloneElement(child, undefined, enhancedChildren);
}

function getListItemFromOrderedListChild(
  child: ReactNode
): ReactElement<{ children?: ReactNode; className?: string }> | null {
  if (isListItemElement(child)) {
    return child;
  }

  if (!isFragmentElement(child)) {
    return null;
  }

  return Children.toArray(child.props.children).find(isListItemElement) ?? null;
}

function getOrderedListStepNumbers(children: ReactNode): number[] | null {
  const listItems = Children.toArray(children)
    .map(getListItemFromOrderedListChild)
    .filter((child) => child !== null);

  if (listItems.length === 0) {
    return null;
  }

  const stepNumbers = listItems.map((item) => getLeadingStepNumber(item.props.children));

  if (stepNumbers.some((stepNumber) => stepNumber === null)) {
    return null;
  }

  return stepNumbers as number[];
}

function enhanceOrderedList(node: MarkdownElement) {
  const stepNumbers = getOrderedListStepNumbers(node.props.children);

  if (!stepNumbers) {
    return node;
  }

  let stepIndex = 0;
  const items = Children.toArray(node.props.children).map((child) => {
    const hasListItem =
      isListItemElement(child) ||
      (isFragmentElement(child) && Children.toArray(child.props.children).some(isListItemElement));

    if (!hasListItem) {
      return child;
    }

    const stepNumber = stepNumbers[stepIndex] ?? stepIndex + 1;
    stepIndex += 1;
    return enhanceOrderedListChild(child, stepNumber);
  });

  return cloneElement(
    node,
    {
      className: ['cms-docs-step-list', node.props.className].filter(Boolean).join(' '),
    },
    items
  );
}

function getStepListItems(node: MarkdownElement): ReactElement<{
  children?: ReactNode;
  className?: string;
}>[] {
  return Children.toArray(node.props.children).flatMap((child) => {
    const listItem = getListItemFromOrderedListChild(child);
    return listItem ? [listItem] : [];
  });
}

function appendStepContent(node: ReactNode, extraContent: ReactNode[]): ReactNode {
  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return node;
  }

  if (hasClassName(node, 'cms-docs-step-content')) {
    const stepContentNode = node as ReactElement<{ children?: ReactNode; className?: string }>;
    const nextChildren = [...Children.toArray(stepContentNode.props.children), ...extraContent].map(
      (child, index) => withStableKey(child, `cms-step-content-${index}`)
    );

    return cloneElement(node, undefined, nextChildren);
  }

  const element = node as ReactElement<{ children?: ReactNode; className?: string }>;
  const children = Children.map(element.props.children, (child) =>
    appendStepContent(child, extraContent)
  );

  return cloneElement(node, undefined, children);
}

function appendContentToStepItem(
  item: ReactElement<{ children?: ReactNode; className?: string }>,
  extraContent: ReactNode[]
) {
  if (extraContent.length === 0) {
    return item;
  }

  const children = Children.map(item.props.children, (child) =>
    appendStepContent(child, extraContent)
  );

  return cloneElement(item, undefined, children);
}

function isAppendableStepSibling(node: ReactNode): boolean {
  if (!isValidElement(node)) {
    return false;
  }

  // Custom renderer components like ClickableImage or code wrappers
  // should still be appendable into the active step.
  if (typeof node.type !== 'string') {
    return true;
  }

  // Append normal content blocks.
  return ['p', 'ul', 'ol', 'img', 'pre', 'figure', 'blockquote', 'div'].includes(node.type);
}

function isStepContentBoundary(node: ReactNode): boolean {
  const text = getTextContent(node).trim();

  return (
    text === 'end-step' ||
    (isValidElement(node) &&
      typeof node.type === 'string' &&
      (/^h[1-3]$/.test(node.type) || node.type === 'hr'))
  );
}

function flattenStepSiblings(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isFragmentElement(child) ? Children.toArray(child.props.children) : [child]
  );
}

function mergeStepListSiblings(children: ReactNode): ReactNode {
  const output: ReactNode[] = [];
  let activeList: MarkdownElement | null = null;
  let activeItems: ReactElement<{ children?: ReactNode; className?: string }>[] = [];

  function flushActiveList() {
    if (!activeList) {
      return;
    }

    const keyedItems = activeItems.map((item, index) =>
      // biome-ignore lint/suspicious/noArrayIndexKey: Markdown list items do not have stable IDs; order is fixed after parsing.
      cloneElement(item, { key: `cms-step-item-${index}` })
    );

    output.push(cloneElement(activeList, { key: `cms-step-list-${output.length}` }, keyedItems));
    activeList = null;
    activeItems = [];
  }

  for (const child of flattenStepSiblings(children)) {
    if (isStepListElement(child)) {
      const items = getStepListItems(child);

      if (items.length === 0) {
        flushActiveList();
        output.push(child);
        continue;
      }

      activeList ??= child;
      activeItems = [...activeItems, ...items];
      continue;
    }

    if (
      activeList &&
      activeItems.length > 0 &&
      isAppendableStepSibling(child) &&
      !isStepContentBoundary(child)
    ) {
      const lastItemIndex = activeItems.length - 1;
      const lastItem = activeItems[lastItemIndex];

      if (lastItem) {
        activeItems[lastItemIndex] = appendContentToStepItem(lastItem, [child]);
        continue;
      }
    }

    flushActiveList();
    output.push(child);
  }

  flushActiveList();
  return output;
}

function normalizeMarkdownKeys(node: ReactNode, path = 'cms-docs-markdown'): ReactNode {
  if (Array.isArray(node)) {
    return node.map((child, index) =>
      withStableKey(normalizeMarkdownKeys(child, `${path}-${index}`), `${path}-${index}`)
    );
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return node;
  }

  const element = node as ReactElement<{ children?: ReactNode }>;
  const childArray = Children.toArray(element.props.children);

  if (childArray.length === 0) {
    return cloneElement(element, { key: path });
  }

  const children = childArray.map((child, index) =>
    withStableKey(normalizeMarkdownKeys(child, `${path}-${index}`), `${path}-${index}`)
  );

  return cloneElement(element, { key: path }, children);
}

function enhanceMarkdownNode(node: ReactNode, inList = false, orderedSteps = false): ReactNode {
  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return node;
  }

  const isList = node.type === 'ol' || node.type === 'ul';
  const children = Children.map(node.props.children, (child) =>
    enhanceMarkdownNode(child, inList || isList, orderedSteps)
  );

  if (node.type === 'table') {
    return <div className="cms-docs-table-scroll">{cloneElement(node, undefined, children)}</div>;
  }

  if (orderedSteps && node.type === 'ol' && !inList) {
    return enhanceOrderedList(cloneElement(node as MarkdownElement, undefined, children));
  }

  if (node.type !== 'blockquote') {
    if (orderedSteps && hasClassName(node, 'cms-docs-markdown')) {
      return cloneElement(node, undefined, mergeStepListSiblings(children));
    }

    return cloneElement(node, undefined, children);
  }

  const explicitKind = getExplicitCalloutKind(children);

  if (!explicitKind) {
    return cloneElement(node, undefined, children);
  }

  const variant = getCalloutVariant(explicitKind);
  const kind = getCalloutKind(explicitKind, variant);
  const markerWasRemoved = { current: false };
  const calloutChildren = stripCalloutMarker(children, markerWasRemoved);

  return cloneElement(
    node as ReactElement<{ children?: ReactNode; className?: string }>,
    {
      className: [
        'cms-docs-callout',
        `cms-docs-callout-${variant}`,
        `cms-docs-callout-${kind}`,
        node.props.className,
      ]
        .filter(Boolean)
        .join(' '),
    },
    <>
      {getCalloutIcon(kind)}
      {calloutChildren}
    </>
  );
}

export async function DocsMarkdown({
  content,
  orderedSteps = false,
}: {
  content: string;
  orderedSteps?: boolean;
}) {
  const rendered = await RendererDocsMarkdown({
    content,
    renderImage: (props: {
      src: string;
      alt: string;
      title?: string;
      loading?: 'eager' | 'lazy';
    }) => <ClickableImage {...props} />,
    renderCodeAction: ({ code }: { code: string; language: string }) => (
      <CopyCodeButton code={code} />
    ),
  });

  return normalizeMarkdownKeys(enhanceMarkdownNode(rendered, false, orderedSteps));
}
