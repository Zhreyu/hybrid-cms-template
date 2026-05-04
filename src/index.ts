#!/usr/bin/env bun
import pc from "picocolors";
import { existsSync, mkdirSync } from "fs";
import { createInterface, emitKeypressEvents } from "readline";
import { stdin as input, stdout as output } from "process";
import { join, resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Framework = "next" | "tanstack";

const nextTemplates = {
  base: {
    label: "Base",
    description: "Starter CMS template (Next.js)",
    dir: join(__dirname, "nextjs", "template", "base"),
  },
  docs: {
    label: "Docs",
    description: "Full documentation site (Next.js)",
    dir: join(__dirname, "nextjs", "template", "docs"),
  },
} as const;

const tanstackTemplates = {
  base: {
    label: "Base",
    description: "Starter CMS template (TanStack Start)",
    dir: join(__dirname, "tanstack", "template", "base"),
  },
  docs: {
    label: "Docs",
    description: "Full documentation site (TanStack Start)",
    dir: join(__dirname, "tanstack", "template", "docs"),
  },
} as const;

type NextTemplateName = keyof typeof nextTemplates;
type TanstackTemplateName = keyof typeof tanstackTemplates;
type AnyTemplateName = NextTemplateName | TanstackTemplateName;

/** npm/pnpm set this; includes the real argv the user ran (reliable on Windows where `argv[1]` is `index.ts`). */
function npmArgvHaystack(): string {
  const raw = process.env.npm_config_argv;
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { original?: unknown[]; cooked?: unknown[] };
    return [...(parsed.original ?? []), ...(parsed.cooked ?? [])].map(String).join("\0");
  } catch {
    return "";
  }
}

/** How the CLI was launched: env override, npm argv, full argv, then basename(argv[1]) for Unix shims. */
function binInvocationHaystack(): string {
  const parts = [
    process.env.PROFOUND_DEFAULT_FRAMEWORK ?? "",
    npmArgvHaystack(),
    ...process.argv,
    basename(process.argv[1] ?? ""),
  ];
  return parts.join("\0").replace(/\\/g, "/");
}

function parseFrameworkArg(args: string[]): Framework | undefined {
  const raw = args.find((a) => a.startsWith("--framework="))?.split("=")[1];
  if (raw === "next" || raw === "tanstack") {
    return raw;
  }
  return undefined;
}

function parseTemplateArg(args: string[]): string | undefined {
  return args.find((a) => a.startsWith("--template="))?.split("=")[1];
}

const args = process.argv.slice(2);
const noGit = args.includes("--no-git");
const noInstall = args.includes("--no-install");
const projectName =
  args.find((a) => !a.startsWith("--")) ?? "my-profound-app";
const frameworkArg = parseFrameworkArg(args);
const templateArg = parseTemplateArg(args);

function defaultFrameworkFromBin(): Framework | undefined {
  const env = process.env.PROFOUND_DEFAULT_FRAMEWORK?.trim().toLowerCase();
  if (env === "tanstack" || env === "next") {
    return env;
  }

  const hay = binInvocationHaystack().toLowerCase();
  if (hay.includes("create-profound-tanstack")) {
    return "tanstack";
  }
  if (hay.includes("create-profound-next")) {
    return "next";
  }
  return undefined;
}

async function main() {
  const framework = await resolveFramework(frameworkArg, defaultFrameworkFromBin());
  const { templateName, template } = await resolveTemplate(framework, templateArg);

  let dependenciesInstalled = false;

  console.log(
    `  Creating ${pc.cyan(projectName)} (${pc.dim(framework)}) from ${pc.cyan(template.label)}…`
  );
  console.log();

  const targetDir = resolve(process.cwd(), projectName);
  const packageName = basename(targetDir);

  if (existsSync(targetDir)) {
    console.error(pc.red(`  ✗  Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  await copyTemplate(template.dir, targetDir, packageName);
  console.log(`  ${pc.green("✓")}  Template scaffolded`);

  if (!noInstall) {
    process.stdout.write(`  ${pc.dim("•")}  Installing dependencies...`);

    try {
      execSync("bun install", { cwd: targetDir, stdio: "ignore" });
      process.stdout.write("\r\x1B[2K");
      console.log(`  ${pc.green("✓")}  Dependencies installed`);
      dependenciesInstalled = true;
    } catch {
      process.stdout.write("\r\x1B[2K");
      console.log(`  ${pc.yellow("!")}  Dependency install failed`);
      console.log(
        pc.dim(`   Run "cd ${projectName} && bun install" to finish setup.`)
      );
    }
  }

  if (!noGit) {
    try {
      execSync("git init", { cwd: targetDir, stdio: "ignore" });
      execSync("git add -A", { cwd: targetDir, stdio: "ignore" });
      execSync('git commit -m "chore: initial scaffold"', {
        cwd: targetDir,
        stdio: "ignore",
      });
      console.log(`  ${pc.green("✓")}  Git repository initialised`);
    } catch {
      // Ignore missing git.
    }
  }

  console.log(`  ${pc.green("✓")}  Ready to run locally`);
  console.log();
  console.log(`  ${pc.bold(pc.green("Done."))}`);
  console.log();
  console.log(`  ${pc.dim("Next steps")}`);
  console.log(`  ${pc.cyan("cd")} ${projectName}`);

  if (!dependenciesInstalled) {
    console.log(`  ${pc.cyan("bun install")}`);
  }

  console.log(`  ${pc.cyan("bun dev")}`);
  console.log();
}

async function resolveFramework(
  fromFlag: Framework | undefined,
  fromBin: Framework | undefined
): Promise<Framework> {
  if (fromFlag) {
    return fromFlag;
  }
  if (fromBin) {
    return fromBin;
  }
  if (!input.isTTY || !output.isTTY) {
    return "next";
  }
  return selectFramework();
}

async function selectFramework(): Promise<Framework> {
  const options: { id: Framework; label: string; description: string }[] = [
    { id: "next", label: "Next.js", description: "App Router + cms-renderer" },
    {
      id: "tanstack",
      label: "TanStack Start",
      description: "Vite + TanStack Router + cms-renderer",
    },
  ];
  let selectedIndex = 0;
  let renderedLineCount = 0;

  return new Promise<Framework>((resolveFramework) => {
    const rl = createInterface({ input, output });
    emitKeypressEvents(input, rl);

    const previousRawMode = "isRaw" in input ? input.isRaw : false;
    if (typeof input.setRawMode === "function") {
      input.setRawMode(true);
    }

    const cleanup = () => {
      input.off("keypress", onKeypress);
      if (typeof input.setRawMode === "function") {
        input.setRawMode(previousRawMode);
      }
      rl.close();
    };

    const finish = (value: Framework) => {
      cleanup();
      process.stdout.write("\x1B[?25h");
      process.stdout.write("\n");
      resolveFramework(value);
    };

    const render = () => {
      if (renderedLineCount > 0) {
        for (let index = 0; index < renderedLineCount; index += 1) {
          process.stdout.write("\x1B[1A\x1B[2K");
        }
      }

      const ruleWidth = Math.max(28, (output.columns ?? 80) - 4);
      const divider = pc.dim("─".repeat(ruleWidth));

      const lines = [
        "",
        `  ${pc.green("?")} ${pc.bold("Which framework do you want?")}`,
        "",
      ];

      options.forEach((opt, index) => {
        const isSelected = index === selectedIndex;
        const pointer = isSelected ? pc.green("›") : " ";
        const label = isSelected
          ? pc.white(pc.bold(opt.label))
          : pc.dim(opt.label);
        lines.push(`  ${pointer} ${label} ${pc.dim(opt.description)}`);
      });

      lines.push("");
      lines.push(`  ${divider}`);
      lines.push("");
      lines.push(`  ${pc.dim("Use ↑ ↓ to move, Enter to select.")}`);

      process.stdout.write(lines.join("\n") + "\n");
      renderedLineCount = lines.length;
    };

    const onKeypress = (_: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\x1B[?25h");
        process.stdout.write("\n");
        process.exit(1);
      }

      if (key.name === "up") {
        selectedIndex =
          (selectedIndex - 1 + options.length) % options.length;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
        return;
      }

      if (key.name === "return") {
        finish(options[selectedIndex].id);
      }
    };

    process.stdout.write("\x1B[?25l");
    input.on("keypress", onKeypress);
    render();
  });
}

async function resolveTemplate(
  framework: Framework,
  requested?: string
): Promise<{
  templateName: AnyTemplateName;
  template: { label: string; description: string; dir: string };
}> {
  if (framework === "next") {
    const name = await resolveNextTemplateName(requested as NextTemplateName | undefined);
    return { templateName: name, template: nextTemplates[name] };
  }
  const name = await resolveTanstackTemplateName(requested as TanstackTemplateName | undefined);
  return { templateName: name, template: tanstackTemplates[name] };
}

async function resolveNextTemplateName(
  requested?: NextTemplateName
): Promise<NextTemplateName> {
  if (requested) {
    if (requested in nextTemplates) {
      return requested as NextTemplateName;
    }
    const available = Object.keys(nextTemplates).join(", ");
    console.error(
      pc.red(`  ✗  Unknown template "${requested}". Use one of: ${available}.`)
    );
    process.exit(1);
  }

  if (!input.isTTY || !output.isTTY) {
    return "base";
  }

  return selectFromTemplateMap(nextTemplates) as Promise<NextTemplateName>;
}

async function resolveTanstackTemplateName(
  requested?: TanstackTemplateName
): Promise<TanstackTemplateName> {
  if (requested) {
    if (requested in tanstackTemplates) {
      return requested as TanstackTemplateName;
    }
    const available = Object.keys(tanstackTemplates).join(", ");
    console.error(
      pc.red(`  ✗  Unknown template "${requested}". Use one of: ${available}.`)
    );
    process.exit(1);
  }

  if (!input.isTTY || !output.isTTY) {
    return "base";
  }

  return selectFromTemplateMap(tanstackTemplates) as Promise<TanstackTemplateName>;
}

async function selectFromTemplateMap<T extends string>(
  templates: Record<T, { label: string; description: string; dir: string }>
): Promise<T> {
  const templateNames = Object.keys(templates) as T[];
  let selectedIndex = 0;
  let renderedLineCount = 0;

  return new Promise<T>((resolveTemplate) => {
    const rl = createInterface({ input, output });
    emitKeypressEvents(input, rl);

    const previousRawMode = "isRaw" in input ? input.isRaw : false;
    if (typeof input.setRawMode === "function") {
      input.setRawMode(true);
    }

    const cleanup = () => {
      input.off("keypress", onKeypress);
      if (typeof input.setRawMode === "function") {
        input.setRawMode(previousRawMode);
      }
      rl.close();
    };

    const finish = (value: T) => {
      cleanup();
      process.stdout.write("\x1B[?25h");
      process.stdout.write("\n");
      resolveTemplate(value);
    };

    const render = () => {
      if (renderedLineCount > 0) {
        for (let index = 0; index < renderedLineCount; index += 1) {
          process.stdout.write("\x1B[1A\x1B[2K");
        }
      }

      const ruleWidth = Math.max(28, (output.columns ?? 80) - 4);
      const divider = pc.dim("─".repeat(ruleWidth));

      const lines = [
        "",
        `  ${pc.green("?")} ${pc.bold("Which template do you want to start from?")}`,
        "",
      ];

      templateNames.forEach((name, index) => {
        const template = templates[name];
        const isSelected = index === selectedIndex;
        const pointer = isSelected ? pc.green("›") : " ";
        const label = isSelected
          ? pc.white(pc.bold(template.label))
          : pc.dim(template.label);
        lines.push(`  ${pointer} ${label} ${pc.dim(template.description)}`);
      });

      lines.push("");
      lines.push(`  ${divider}`);
      lines.push("");
      lines.push(`  ${pc.dim("Use ↑ ↓ to move, Enter to select.")}`);

      process.stdout.write(lines.join("\n") + "\n");
      renderedLineCount = lines.length;
    };

    const onKeypress = (_: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\x1B[?25h");
        process.stdout.write("\n");
        process.exit(1);
      }

      if (key.name === "up") {
        selectedIndex =
          (selectedIndex - 1 + templateNames.length) % templateNames.length;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % templateNames.length;
        render();
        return;
      }

      if (key.name === "return") {
        finish(templateNames[selectedIndex]);
      }
    };

    process.stdout.write("\x1B[?25l");
    input.on("keypress", onKeypress);
    render();
  });
}

const renderedTextExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

function resolveDestinationFile(file: string): string {
  if (basename(file) === "_gitignore") {
    return file.replace("_gitignore", ".gitignore");
  }

  return file;
}

function getFileExtension(file: string): string {
  const fileName = basename(file);

  if (fileName.startsWith(".") && !fileName.slice(1).includes(".")) {
    return fileName;
  }

  if (file.includes(".")) {
    return file.slice(file.lastIndexOf("."));
  }

  return "";
}

function isTextTemplateFile(file: string): boolean {
  return renderedTextExtensions.has(getFileExtension(file)) || basename(file) === "Dockerfile";
}

/** Files that must never ship to scaffolded apps (Create TanStack App metadata, etc.). */
const skipScaffoldBasenames = new Set([".cta.json"]);

async function copyTemplate(src: string, dest: string, name: string) {
  mkdirSync(dest, { recursive: true });

  const glob = new Bun.Glob("**/*");

  for await (const file of glob.scan({ cwd: src, dot: true, onlyFiles: true })) {
    if (skipScaffoldBasenames.has(basename(file))) {
      continue;
    }

    const srcPath = join(src, file);

    const destFile = resolveDestinationFile(file);
    const destPath = join(dest, destFile);

    mkdirSync(dirname(destPath), { recursive: true });

    if (isTextTemplateFile(file)) {
      const raw = await Bun.file(srcPath).text();
      const rendered = raw.replace(/\{\{PROJECT_NAME\}\}/g, name);
      await Bun.write(destPath, rendered);
      continue;
    }

    await Bun.write(destPath, Bun.file(srcPath));
  }
}

main().catch((err: Error) => {
  console.error(pc.red("  ✗  Error:"), err.message);
  process.exit(1);
});
