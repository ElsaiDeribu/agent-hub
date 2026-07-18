#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import prompts from "prompts";
import { isSafeTarget } from "./is-safe-target.js";

const OWNER = "ElsaiDeribu";
const REPO = "agent-hub";
const BRANCH = "main";
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// ---------------------------------------------------------------------------
// Registry types
// ---------------------------------------------------------------------------
type RegistryFile = {
  path: string;   // path in the GitHub repo
  target: string; // destination path relative to install dir
};

type RegistryItem = {
  name: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  languages?: string[];
  frameworks?: string[];
  frameworkFiles?: Record<string, RegistryFile[]>;
  dependencies?: Record<string, string[]>;
  /** Legacy: single-framework items */
  files?: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
async function fetchRegistry(): Promise<Registry> {
  const res = await fetch(`${RAW}/registry.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch registry.json (${res.status})`);
  }
  return (await res.json()) as Registry;
}

async function fetchFile(repoPath: string): Promise<Buffer> {
  const res = await fetch(`${RAW}/${repoPath}`);
  if (!res.ok) {
    throw new Error(`Failed to download ${repoPath} (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function fmtFrameworks(frameworks: string[] | undefined): string {
  if (!frameworks || frameworks.length === 0) return "";
  return chalk.dim(`[${frameworks.join(", ")}]`);
}

function fmtCategory(category: string | undefined): string {
  if (!category) return "";
  const colors: Record<string, (s: string) => string> = {
    support: chalk.blue,
    "dev-tools": chalk.magenta,
    research: chalk.yellow,
    example: chalk.dim,
  };
  const fn = colors[category] ?? chalk.white;
  return fn(`(${category})`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const program = new Command();

program
  .name("agent-hub-harness")
  .description("Add agent templates to your project from the agent-hub registry")
  .version("1.0.2");

// ── add ────────────────────────────────────────────────────────────────────
program
  .command("add <name>")
  .description("Download an agent template into your project")
  .option("-f, --framework <framework>", "Orchestration framework to use (e.g. langchain, mastra, vercel-ai)")
  .option("-d, --dir <path>", "Target directory", ".")
  .action(async (name: string, options: { framework?: string; dir: string }) => {
    const spinner = ora(`Fetching registry...`).start();

    try {
      const registry = await fetchRegistry();
      const item = registry.items.find((entry) => entry.name === name);

      if (!item) {
        const available = registry.items.map((e) => e.name).join(", ");
        spinner.fail(
          chalk.red(
            `Agent "${name}" not found.${available ? ` Available: ${available}` : ""}`
          )
        );
        process.exit(1);
      }

      spinner.stop();

      // ── Resolve framework ──────────────────────────────────────────────
      const frameworkFiles = item.frameworkFiles ?? (item.files ? { generic: item.files } : null);

      if (!frameworkFiles) {
        console.error(chalk.red(`No files defined for "${name}".`));
        process.exit(1);
      }

      const availableFrameworks = Object.keys(frameworkFiles);
      let framework = options.framework;

      if (!framework) {
        if (availableFrameworks.length === 1) {
          framework = availableFrameworks[0];
        } else {
          // Prompt interactively
          const answer = await prompts({
            type: "select",
            name: "framework",
            message: `Which framework would you like to use for "${name}"?`,
            choices: availableFrameworks.map((f) => ({
              title: f,
              value: f,
            })),
          });

          if (!answer.framework) {
            console.log(chalk.yellow("Aborted."));
            process.exit(0);
          }

          framework = answer.framework as string;
        }
      }

      if (!availableFrameworks.includes(framework)) {
        console.error(
          chalk.red(
            `Framework "${framework}" is not available for "${name}". Available: ${availableFrameworks.join(", ")}`
          )
        );
        process.exit(1);
      }

      const files = frameworkFiles[framework];
      const targetDir = path.resolve(options.dir, name);

      // ── Download files ─────────────────────────────────────────────────
      const dlSpinner = ora(
        `Adding "${name}" (${framework}) to ${path.relative(process.cwd(), targetDir) || "."}/`
      ).start();

      for (const file of files) {
        if (!isSafeTarget(file.target, targetDir)) {
          throw new Error(
            `Unsafe file path "${file.target}" detected in registry. Installation aborted.`
          );
        }

        const dest = file.target.startsWith("~/")
          ? path.join(targetDir, file.target.slice(2))
          : path.resolve(targetDir, file.target);

        const content = await fetchFile(file.path);
        await fs.ensureDir(path.dirname(dest));
        await fs.writeFile(dest, content);
      }

      dlSpinner.succeed(
        chalk.green(`Added "${name}" (${framework}) → ${targetDir}`)
      );

      // ── Print dependency install hint ──────────────────────────────────
      const deps = item.dependencies?.[framework];
      if (deps && deps.length > 0) {
        console.log("");
        console.log(chalk.bold("Next: install dependencies"));
        console.log(chalk.dim("  npm install " + deps.join(" ")));
        console.log(chalk.dim("  # or: pnpm add / yarn add"));
      }

      // ── Print files written ────────────────────────────────────────────
      console.log("");
      console.log(chalk.bold("Files added:"));
      for (const file of files) {
        const relativeDest = path.join(
          path.relative(process.cwd(), targetDir),
          file.target
        );
        console.log(`  ${chalk.cyan(relativeDest)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(message));
      process.exit(1);
    }
  });

// ── list ───────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List all available agent templates")
  .option("-c, --category <category>", "Filter by category (e.g. support, dev-tools, research)")
  .option("-f, --framework <framework>", "Filter by supported framework (e.g. langchain, mastra)")
  .action(async (options: { category?: string; framework?: string }) => {
    const spinner = ora("Fetching registry...").start();

    try {
      const registry = await fetchRegistry();
      spinner.stop();

      let items = registry.items;

      // ── Apply filters ──────────────────────────────────────────────────
      if (options.category) {
        items = items.filter((i) => i.category === options.category);
      }
      if (options.framework) {
        items = items.filter((i) =>
          i.frameworks?.includes(options.framework!)
        );
      }

      if (items.length === 0) {
        console.log(chalk.yellow("No agents found matching the filters."));
        return;
      }

      console.log("");
      console.log(chalk.bold(`agent-hub registry  (${items.length} agent${items.length === 1 ? "" : "s"})`));
      console.log(chalk.dim("─".repeat(60)));

      for (const item of items) {
        const category = fmtCategory(item.category);
        const frameworks = fmtFrameworks(item.frameworks);
        const title = item.title ?? item.name;

        console.log(`${chalk.cyan.bold(item.name)}  ${category}  ${frameworks}`);
        if (item.title && item.title !== item.name) {
          console.log(`  ${chalk.white(item.title)}`);
        }
        if (item.description) {
          console.log(`  ${chalk.dim(item.description)}`);
        }
        if (item.tags && item.tags.length > 0) {
          console.log(`  ${chalk.dim("tags:")} ${item.tags.map((t) => chalk.dim(t)).join(chalk.dim(", "))}`);
        }
        console.log("");
      }

      console.log(chalk.dim(`Add an agent:  agent-hub-harness add <name> [--framework <framework>]`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(message));
      process.exit(1);
    }
  });

// ── info ───────────────────────────────────────────────────────────────────
program
  .command("info <name>")
  .description("Show details about an agent template")
  .action(async (name: string) => {
    const spinner = ora("Fetching registry...").start();

    try {
      const registry = await fetchRegistry();
      spinner.stop();

      const item = registry.items.find((e) => e.name === name);

      if (!item) {
        const available = registry.items.map((e) => e.name).join(", ");
        console.error(
          chalk.red(
            `Agent "${name}" not found.${available ? ` Available: ${available}` : ""}`
          )
        );
        process.exit(1);
      }

      console.log("");
      console.log(chalk.cyan.bold(item.title ?? item.name));
      if (item.description) console.log(item.description);
      console.log("");

      if (item.category) {
        console.log(`${chalk.bold("Category:")}  ${item.category}`);
      }
      if (item.tags?.length) {
        console.log(`${chalk.bold("Tags:")}      ${item.tags.join(", ")}`);
      }
      if (item.languages?.length) {
        console.log(`${chalk.bold("Languages:")} ${item.languages.join(", ")}`);
      }
      if (item.frameworks?.length) {
        console.log(`${chalk.bold("Frameworks:")} ${item.frameworks.join(", ")}`);
      }

      if (item.dependencies) {
        console.log("");
        console.log(chalk.bold("Dependencies by framework:"));
        for (const [fw, deps] of Object.entries(item.dependencies)) {
          if (deps.length > 0) {
            console.log(`  ${chalk.cyan(fw)}: ${deps.join(", ")}`);
          }
        }
      }

      if (item.frameworkFiles) {
        console.log("");
        console.log(chalk.bold("Files by framework:"));
        for (const [fw, files] of Object.entries(item.frameworkFiles)) {
          console.log(`  ${chalk.cyan(fw)}: ${files.map((f) => f.target).join(", ")}`);
        }
      }

      console.log("");
      const fw = item.frameworks?.[0] ?? "";
      console.log(chalk.dim(`Add to project:  agent-hub-harness add ${name}${fw ? ` --framework ${fw}` : ""}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(message));
      process.exit(1);
    }
  });

program.parse();
