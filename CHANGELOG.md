# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-04-09

### Added

- Automatic dependency installation after scaffolding a project.
- A `--no-install` flag to skip dependency installation when needed.
- `CHANGELOG.md` file for development update.
- `.gitignore` for development templates testing.

### Changed

- Replaced the text prompt for template selection with an interactive arrow-key picker.
- Simplified template labels and descriptions in the CLI.
- Updated scaffold output so setup progress and next steps are clearer.
- Updated the interactive picker divider to follow terminal width.

### Documentation

- Updated the README to reflect automatic installs and the `--no-install` workflow.

## [0.1.4] - 2026-04-07

### Added

- A full `docs` site template with documentation-specific UI, search helpers, and generated CMS schema support.
- Multi-template scaffolding support in the CLI.

### Changed

- Aligned the scaffolded base template with the CMS runtime.
- Refactored the generator flow to support selecting between templates.

### Documentation

- Updated the README for the multi-template workflow.

## [0.1.3] - 2026-03-07

### Changed

- Updated scaffolded app dependencies to `next@^16.1.1`, `react@^19`, and `react-dom@^19`.
- Replaced the base template `middleware.ts` integration with `proxy.ts`.

## [0.1.2] - 2026-03-07

### Changed

- Version-only release.

## [0.1.1] - 2026-02-27

### Changed

- Switched schema generation in scaffolded apps to run with Bun.
- Updated the base template catch-all page to use the CMS renderer import expected by the scaffolded runtime.

## [0.1.0] - 2026-02-24

### Added

- Initial `create-profound-next` CLI for scaffolding a Profound CMS Next.js app.
- The base application template and project generation flow.
- Initial README documentation.
- A base template `.env.example`.

[Unreleased]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/eaf39b9...HEAD
[0.1.5]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/c1c80fc...eaf39b9
[0.1.4]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/d1643f9...c1c80fc
[0.1.3]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/3d9c6d4...d1643f9
[0.1.2]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/75cad88...3d9c6d4
[0.1.1]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/49230aa...75cad88
[0.1.0]: https://github.com/eng-manager-xyz/hybrid-cms-template/compare/74733b5...49230aa
