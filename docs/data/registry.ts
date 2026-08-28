import type { RegistryCatalog, RegistryItem } from "@/types/registry";
import { getFileUrl, normalizeRegistryItems } from "@/data/registry-shared";

const REGISTRY_URL = getFileUrl("registry.json");

let cachedItems: RegistryItem[] | null = null;
let inflight: Promise<RegistryItem[]> | null = null;

export async function getRegistryItems(): Promise<RegistryItem[]> {
  if (cachedItems) return cachedItems;
  if (!inflight) {
    inflight = fetch(REGISTRY_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load registry: ${res.status} ${res.statusText}`);
        }
        const catalog = (await res.json()) as RegistryCatalog;
        cachedItems = normalizeRegistryItems(catalog);
        return cachedItems;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function getRegistryItem(name: string): Promise<RegistryItem | undefined> {
  const items = await getRegistryItems();
  return items.find((item) => item.name === name);
}

export {
  CATEGORIES,
  CATEGORY_COLORS,
  FRAMEWORK_COLORS,
  getFileUrl,
  getGitHubUrl,
} from "@/data/registry-shared";
