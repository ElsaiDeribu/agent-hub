/// <reference types="vite/client" />

declare module '@repo-registry' {
  import type { RegistryCatalog } from '@/types/registry';
  const catalog: RegistryCatalog;
  export default catalog;
}

interface ImportMetaEnv {
  readonly VITE_HOST_API?: string;
  readonly VITE_ASSETS_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
