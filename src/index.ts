#!/usr/bin/env bun
import pc from "picocolors";
import { existsSync, mkdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const noGit = args.includes("--no-git");
const projectName =
  args.find((a) => !a.startsWith("--")) ?? "my-profound-app";

const templateDir = join(__dirname, "templates", "base");

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
async function main() {
  console.log();
  console.log(`  ${pc.bold("create-profound-next")}`);
  console.log();
  console.log(`  Scaffolding ${pc.cyan(projectName)}…`);
  console.log();

  const targetDir = join(process.cwd(), projectName);

  if (existsSync(targetDir)) {
    console.error(pc.red(`  ✗  Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  // 1. Copy template files
  await copyTemplate(templateDir, targetDir, projectName);
  console.log(`  ${pc.green("✓")}  Template copied`);

  // 2. Generate package.json with the project name
  const pkg = generatePackageJson(projectName);
  await Bun.write(
    join(targetDir, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n"
  );
  console.log(`  ${pc.green("✓")}  package.json written`);

  // 3. Optional git init
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
      // git unavailable – skip silently
    }
  }

  // 4. Done
  console.log();
  console.log(`  ${pc.bold(pc.green("Done!"))} Your app is ready.\n`);
  console.log(`  ${pc.dim("Next steps:")}\n`);
  console.log(`    ${pc.cyan("cd")} ${projectName}`);
  console.log(`    ${pc.cyan("bun install")}`);
  console.log(`    ${pc.cyan("bun dev")}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively copy a template directory, replacing {{PROJECT_NAME}} tokens
 * and mapping `_gitignore` → `.gitignore` for npm-publish compatibility.
 */
async function copyTemplate(src: string, dest: string, name: string) {
  mkdirSync(dest, { recursive: true });

  const glob = new Bun.Glob("**/*");

  for await (const file of glob.scan({ cwd: src, dot: true, onlyFiles: true })) {
    const srcPath = join(src, file);

    // Rename `_gitignore` → `.gitignore` so npm publish keeps the file
    const destFile =
      basename(file) === "_gitignore"
        ? file.replace("_gitignore", ".gitignore")
        : file;

    const destPath = join(dest, destFile);

    mkdirSync(dirname(destPath), { recursive: true });

    const raw = await Bun.file(srcPath).text();
    const rendered = raw.replace(/\{\{PROJECT_NAME\}\}/g, name);
    await Bun.write(destPath, rendered);
  }
}

function generatePackageJson(name: string) {
  return {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      "generate-schemas":
        "bun scripts/generate-schemas.ts",
    },
    dependencies: {
      next: "^14.2.0",
      react: "^18.3.0",
      "react-dom": "^18.3.0",
      "cms-renderer": "latest",
      zod: "^4.0.0",
    },
    devDependencies: {
      "@types/node": "^20.0.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      typescript: "^5.0.0",
      tsx: "^4.19.0",
      "object-hash": "^3.0.0",
    },
  };
}

main().catch((err: Error) => {
  console.error(pc.red("  ✗  Error:"), err.message);
  process.exit(1);
});
