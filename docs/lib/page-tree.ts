import type { ReactNode } from "react";
import { source } from "@/lib/source";

export type DocsNavSubItem = {
  title: string;
  url: string;
};

export type DocsNavItem = {
  title: string;
  url: string;
  icon?: "book";
  isActive?: boolean;
  items: DocsNavSubItem[];
};

function toTitle(name: ReactNode): string {
  if (typeof name === "string" || typeof name === "number") {
    return String(name);
  }
  return "Untitled";
}

function collectPages(
  nodes: typeof source.pageTree.children,
): DocsNavSubItem[] {
  const pages: DocsNavSubItem[] = [];

  for (const node of nodes) {
    if (node.type === "page") {
      pages.push({ title: toTitle(node.name), url: node.url });
    } else if (node.type === "folder") {
      pages.push(...collectPages(node.children));
    }
  }

  return pages;
}

/** Serializable nav groups for the docs sidebar (safe to pass to client components). */
export function getDocsNav(): DocsNavItem[] {
  const tree = source.getPageTree();
  const items: DocsNavItem[] = [];

  for (const child of tree.children) {
    if (child.type === "folder") {
      const pages = collectPages(child.children);
      if (pages.length === 0) continue;

      items.push({
        title: toTitle(child.name),
        url: child.index?.url ?? pages[0].url,
        icon: "book",
        isActive: true,
        items: pages,
      });
      continue;
    }

    if (child.type === "page") {
      // Root-level pages fold into a single Documentation group.
      const existing = items.find((item) => item.title === "Documentation");
      const page = { title: toTitle(child.name), url: child.url };

      if (existing) {
        existing.items.push(page);
      } else {
        items.push({
          title: "Documentation",
          url: page.url,
          icon: "book",
          isActive: true,
          items: [page],
        });
      }
    }
  }

  return items;
}
