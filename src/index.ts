#!/usr/bin/env bun
import pc from "picocolors";
import { existsSync, mkdirSync } from "fs";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { join, resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templates = {
  base: {
    label: "Base template",
    description: "Minimal Next.js starter for Profound CMS.",
    dir: join(__dirname, "templates", "base"),
  },
  docs: {
    label: "Docs template",
    description: "Documentation site starter with docs-specific UI.",
    dir: join(__dirname, "templates", "docs"),
  },
} as const;

type TemplateName = keyof typeof templates;

const args = process.argv.slice(2);
const noGit = args.includes("--no-git");
const templateArg = args.find((arg) => arg.startsWith("--template="));
const requestedTemplate = templateArg?.split("=")[1] as TemplateName | undefined;
const projectName =
  args.find((a) => !a.startsWith("--")) ?? "my-profound-app";

async function main() {
  const templateName = await resolveTemplateName(requestedTemplate);
  const template = templates[templateName];

  console.log();
  console.log(`  ${pc.bold("create-profound-next")}`);
  console.log();
  console.log(`  Scaffolding ${pc.cyan(projectName)}…`);
  console.log(`  Template: ${pc.cyan(templateName)} (${template.label})`);
  console.log();

  const targetDir = resolve(process.cwd(), projectName);
  const packageName = basename(targetDir);

  if (existsSync(targetDir)) {
    console.error(pc.red(`  ✗  Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  await copyTemplate(template.dir, targetDir, packageName);
  console.log(`  ${pc.green("✓")}  Template copied`);

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

  console.log();
  console.log(`  ${pc.bold(pc.green("Done!"))} Your app is ready.\n`);
  console.log(`  ${pc.dim("Next steps:")}\n`);
  console.log(`    ${pc.cyan("cd")} ${projectName}`);
  console.log(`    ${pc.cyan("bun install")}`);
  console.log(`    ${pc.cyan("bun dev")}`);
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

  console.log(`  Select a template:\n`);
  const templateNames = Object.keys(templates) as TemplateName[];

  templateNames.forEach((name, index) => {
    const template = templates[name];
    console.log(
      `    ${pc.cyan(String(index + 1))}. ${template.label} ${pc.dim(`(${name})`)}`
    );
    console.log(`       ${pc.dim(template.description)}`);
  });
  console.log();

  const rl = createInterface({ input, output });

  try {
    const answer = (
      await rl.question(`  Template ${pc.dim("(default: 1)")} `)
    ).trim();

    if (!answer || answer === "1" || answer.toLowerCase() === "base") {
      return "base";
    }

    if (answer === "2" || answer.toLowerCase() === "docs") {
      return "docs";
    }
  } finally {
    rl.close();
  }

  console.error(pc.red(`  ✗  Invalid template selection.`));
  process.exit(1);
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
