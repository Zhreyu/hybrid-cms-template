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

const templates = {
  base: {
    label: "Base",
    description: "Starter CMS template",
    dir: join(__dirname, "templates", "base"),
  },
  docs: {
    label: "Docs",
    description: "Full documentation site",
    dir: join(__dirname, "templates", "docs"),
  },
} as const;

type TemplateName = keyof typeof templates;

const args = process.argv.slice(2);
const noGit = args.includes("--no-git");
const noInstall = args.includes("--no-install");
const templateArg = args.find((arg) => arg.startsWith("--template="));
const requestedTemplate = templateArg?.split("=")[1] as TemplateName | undefined;
const projectName =
  args.find((a) => !a.startsWith("--")) ?? "my-profound-app";

async function main() {
  const templateName = await resolveTemplateName(requestedTemplate);
  const template = templates[templateName];
  let dependenciesInstalled = false;

  console.log(`  Creating ${pc.cyan(projectName)} from ${pc.cyan(template.label)}…`);
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
      console.log(`  ${pc.dim(`   Run "cd ${projectName} && bun install" to finish setup.`)}`);
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

async function resolveTemplateName(
  requested?: string
): Promise<TemplateName> {
  if (requested) {
    if (requested in templates) {
      return requested as TemplateName;
    }

    const availableTemplates = Object.keys(templates).join(", ");
    console.error(
      pc.red(
        `  ✗  Unknown template "${requested}". Use one of: ${availableTemplates}.`
      )
    );
    process.exit(1);
  }

  if (!input.isTTY || !output.isTTY) {
    return "base";
  }

  return selectTemplate();
}

async function selectTemplate(): Promise<TemplateName> {
  const templateNames = Object.keys(templates) as TemplateName[];
  let selectedIndex = 0;
  let renderedLineCount = 0;

  return new Promise<TemplateName>((resolve) => {
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

    const finish = (value: TemplateName) => {
      cleanup();
      process.stdout.write("\x1B[?25h");
      process.stdout.write("\n");
      resolve(value);
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

// Text files are token-rendered; binary assets are copied as-is.
async function copyTemplate(src: string, dest: string, name: string) {
  mkdirSync(dest, { recursive: true });

  const glob = new Bun.Glob("**/*");

  for await (const file of glob.scan({ cwd: src, dot: true, onlyFiles: true })) {
    const srcPath = join(src, file);

    // npm publish strips .gitignore from package contents.
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
