"use client";

import { cn } from "@/lib/utils";
import * as Primitive from "fumadocs-core/toc";
import type { TOCItemType } from "fumadocs-core/toc";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type Ref,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const TOCContext = createContext<TOCItemType[]>([]);

function useTOCItems() {
  return use(TOCContext);
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref != null) ref.current = value;
    }
  };
}

interface ComputedSVG {
  width: number;
  height: number;
  content: ReactNode;
  positions: [top: number, bottom: number, x: number][];
}

function getItemOffset(depth: number): number {
  if (depth <= 2) return 20;
  if (depth === 3) return 32;
  return 44;
}

function getLineOffset(depth: number): number {
  if (depth <= 2) return 8;
  if (depth === 3) return 20;
  return 32;
}

function TOCItems({
  ref,
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useTOCItems();
  const [svg, setSvg] = useState<ComputedSVG | null>(null);

  const onPrint = useCallback(() => {
    const container = containerRef.current;
    if (!container || container.clientHeight === 0) return;

    if (items.length === 0) {
      setSvg(null);
      return;
    }

    let w = 0;
    let h = 0;
    let d = "";
    const positions: [top: number, bottom: number, x: number][] = [];
    const output: ReactNode[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const element = container.querySelector<HTMLElement>(
        `a[href="${item.url}"]`,
      );
      if (!element) continue;

      const styles = getComputedStyle(element);
      const x = getLineOffset(item.depth) + 0.5;
      const top = element.offsetTop + Number.parseFloat(styles.paddingTop);
      const bottom =
        element.offsetTop +
        element.clientHeight -
        Number.parseFloat(styles.paddingBottom);

      w = Math.max(x + 8, w);
      h = Math.max(h, bottom);

      if (i === 0) {
        d += ` M${x} ${top} L${x} ${bottom}`;
      } else {
        const [, upperBottom, upperX] =
          i > 0 ? positions[i - 1] : [0, 0, 0];
        d += ` L ${upperX} ${upperBottom} ${x} ${top} L${x} ${bottom}`;
      }

      positions.push([top, bottom, x]);
    }

    output.unshift(
      <path
        key="path"
        d={d}
        className="stroke-primary"
        strokeWidth="1"
        fill="none"
      />,
    );

    setSvg({
      content: output,
      width: w,
      height: h,
      positions,
    });
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(onPrint);
    observer.observe(container);
    onPrint();

    return () => observer.disconnect();
  }, [onPrint]);

  return (
    <div
      ref={mergeRefs(containerRef, ref)}
      className={cn("relative flex flex-col", className)}
      {...props}
    >
      {svg ? <ThumbTrack computed={svg} /> : null}
      {children}
    </div>
  );
}

function ThumbTrack({ computed }: { computed: ComputedSVG }) {
  const ref = useRef<HTMLDivElement>(null);
  const tocInfo = Primitive.useTOC();

  function calculate(items: Primitive.TOCItemInfo[]) {
    const out: Record<string, string> = {};
    const startIdx = items.findIndex((item) => item.active);
    if (startIdx === -1) return out;

    const endIdx = items.findLastIndex((item) => item.active);
    out["--track-top"] = `${computed.positions[startIdx][0]}px`;
    out["--track-bottom"] = `${computed.positions[endIdx][1]}px`;
    return out;
  }

  Primitive.useTOCListener((items) => {
    const element = ref.current;
    if (!element) return;

    for (const [key, value] of Object.entries(calculate(items))) {
      element.style.setProperty(key, value);
    }
  });

  return (
    <div
      ref={ref}
      className="absolute top-0 inset-s-0 origin-center rtl:-scale-x-100"
      style={{
        width: computed.width,
        height: computed.height,
        ...calculate(tocInfo.get()),
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${computed.width} ${computed.height}`}
        className="absolute transition-[clip-path]"
        style={{
          width: computed.width,
          height: computed.height,
          clipPath:
            "polygon(0 var(--track-top,0), 100% var(--track-top,0), 100% var(--track-bottom,0), 0 var(--track-bottom,0))",
        }}
      >
        {computed.content}
      </svg>
    </div>
  );
}

function TOCNavItem({
  item,
  ...props
}: Primitive.TOCItemProps & { item: TOCItemType }) {
  const items = useTOCItems();
  const { isFirst, isLast, svg } = useMemo(() => {
    const index = items.indexOf(item);
    const isFirst = index === 0;
    const isLast = index === items.length - 1;

    const l1 = getLineOffset(item.depth);
    const l0 = isFirst ? l1 : getLineOffset(items[index - 1].depth);
    const l2 = isLast ? l1 : getLineOffset(items[index + 1].depth);

    return {
      isFirst,
      isLast,
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "absolute -top-1.5 inset-s-0 bottom-0 -z-1 h-[calc(100%+0.375rem)] rtl:-scale-x-100",
            l1 !== l2 && "bottom-1.5 h-full",
          )}
          style={{ width: Math.max(l0, l1) + 9 }}
        >
          {l0 !== l1 ? (
            <path
              d={`M ${l0 + 0.5} 0 L ${l0 + 0.5} 0 ${l1 + 0.5} 12`}
              strokeWidth="1"
              fill="none"
              className="stroke-foreground/10"
            />
          ) : null}
          <line
            x1={l1 + 0.5}
            y1={l0 === l1 ? 6 : 12}
            x2={l1 + 0.5}
            y2="100%"
            strokeWidth="1"
            className="stroke-foreground/10"
          />
        </svg>
      ),
    };
  }, [items, item]);

  return (
    <Primitive.TOCItem
      href={item.url}
      {...props}
      className={cn(
        "relative scroll-m-4 py-1.5 text-sm text-muted-foreground transition-colors wrap-anywhere hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-primary",
        isFirst && "pt-0",
        isLast && "pb-0",
        props.className,
      )}
      style={{
        paddingInlineStart: getItemOffset(item.depth),
        ...props.style,
      }}
    >
      {svg}
      {item.title}
    </Primitive.TOCItem>
  );
}

function TOCScrollArea({
  ref,
  className,
  ...props
}: ComponentProps<"div">) {
  const viewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mergeRefs(viewRef, ref)}
      className={cn("relative overflow-auto scrollbar-none", className)}
      {...props}
    >
      <Primitive.ScrollProvider containerRef={viewRef}>
        {props.children}
      </Primitive.ScrollProvider>
    </div>
  );
}

function TableOfContents({ toc }: { toc: TOCItemType[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (toc.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 max-h-[calc(100svh-7rem)]">
        <p className="mb-1 text-sm font-medium">On this page</p>
        <TOCScrollArea
          ref={scrollRef}
          className="max-h-[calc(100svh-13rem)] [mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-1rem),transparent)]"
        >
          <TOCItems>
            <nav className="flex flex-col py-3">
              {toc.map((item) => (
                <TOCNavItem key={item.url} item={item} />
              ))}
            </nav>
          </TOCItems>
        </TOCScrollArea>
      </div>
    </aside>
  );
}

export function DocsPageShell({
  toc,
  children,
}: {
  toc: TOCItemType[];
  children: ReactNode;
}) {
  return (
    <Primitive.AnchorProvider toc={toc}>
      <TOCContext value={toc}>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">{children}</div>
          <TableOfContents toc={toc} />
        </div>
      </TOCContext>
    </Primitive.AnchorProvider>
  );
}
