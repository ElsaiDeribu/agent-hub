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
  preview: {
    starterMessages: string[];
  };
  frameworkFiles: Record<string, RegistryFile[]>;
  dependencies: Record<string, string[]>;
};
