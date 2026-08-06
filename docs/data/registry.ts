import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { RegistryCatalog, RegistryItem } from "@/types/registry";
import { normalizeRegistryItems } from "@/data/registry-shared";

const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "registry.json",
);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as RegistryCatalog;

export const REGISTRY_ITEMS: RegistryItem[] = normalizeRegistryItems(catalog);

export function getRegistryItem(name: string): RegistryItem | undefined {
  return REGISTRY_ITEMS.find((item) => item.name === name);
}

export {
  CATEGORIES,
  CATEGORY_COLORS,
  FRAMEWORK_COLORS,
  getFileUrl,
  getGitHubUrl,
} from "@/data/registry-shared";
