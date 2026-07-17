#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import { isSafeTarget } from "./is-safe-target.js";

const OWNER = "ElsaiDeribu";
const REPO = "agent-hub";
const BRANCH = "main";
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

type RegistryFile = {
  path: string;
  target: string;
};

type RegistryItem = {
  name: string;
  description?: string;
  files: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

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

const program = new Command();

program
  .name("agenthub")
  .description("Add agent templates from the agent-hub GitHub repo")
  .version("1.0.0");

program
  .command("add <name>")
  .description("Download a template from the repo into a folder")
  .option("-d, --dir <path>", "target directory", ".")
  .action(async (name: string, options: { dir: string }) => {
    const spinner = ora(`Adding "${name}" from ${OWNER}/${REPO}...`).start();

    try {
      const registry = await fetchRegistry();
      const item = registry.items.find((entry) => entry.name === name);

      if (!item) {
        const available = registry.items.map((entry) => entry.name).join(", ");
        spinner.fail(
          chalk.red(
            `Template "${name}" not found.${available ? ` Available: ${available}` : ""}`,
          ),
        );
        process.exit(1);
      }

      const targetDir = path.resolve(options.dir, name);

      for (const file of item.files) {
        if (!isSafeTarget(file.target, targetDir)) {
          throw new Error(
            `We found an unsafe file path "${file.target}" in the registry item. Installation aborted.`,
          );
        }

        const dest = file.target.startsWith("~/")
          ? path.join(targetDir, file.target.slice(2))
          : path.resolve(targetDir, file.target);
        const content = await fetchFile(file.path);
        await fs.ensureDir(path.dirname(dest));
        await fs.writeFile(dest, content);
      }

      spinner.succeed(chalk.green(`Added "${name}" to ${targetDir}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(message));
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List templates available in the repo")
  .action(async () => {
    const spinner = ora("Fetching registry...").start();

    try {
      const registry = await fetchRegistry();
      spinner.stop();

      if (registry.items.length === 0) {
        console.log(chalk.yellow("No templates found."));
        return;
      }

      for (const item of registry.items) {
        const desc = item.description ? ` — ${item.description}` : "";
        console.log(`${chalk.cyan(item.name)}${desc}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(message));
      process.exit(1);
    }
  });

program.parse();
