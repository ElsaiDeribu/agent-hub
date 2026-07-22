export type RegistryFile = {
  path: string;
  target: string;
};

export type RegistryItem = {
  name: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  languages: string[];
  frameworks: string[];
  /** When true, docs can start a sandbox preview session (no API keys). */
  sandboxPreview?: boolean;
  preview: {
    starterMessages: string[];
  };
  frameworkFiles: Record<string, RegistryFile[]>;
  dependencies: Record<string, string[]>;
};

export type RegistryCatalog = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};
