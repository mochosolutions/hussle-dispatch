# /bootstrap

Lightweight project scan: detect ecosystem, discover packages, detect validation commands, generate CLAUDE.md.

## Usage

```
/bootstrap
```

## Re-Run Behavior

If `.planning/codebase/packages.json` exists, this is a re-run. Overwrite packages.json.

**CLAUDE.md preservation:** If CLAUDE.md already exists at root, DO NOT overwrite it — the user may have manually edited conventions. Instead, append a `## Bootstrap Refresh (<date>)` section at the bottom noting any newly detected conventions that differ from what's documented.

## Output Management (CRITICAL)

**Every bash command that could produce more than 5 lines of output MUST redirect to /tmp.** This includes all `find`, `grep`, `ls`, and manifest reads.

```bash
# CORRECT — redirect verbose output
find . -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" > /tmp/manifests.txt 2>&1
echo "Found $(wc -l < /tmp/manifests.txt) manifests"

# WRONG — dumps into context
find . -maxdepth 3 -name "package.json" -not -path "*/node_modules/*"
```

---

## Step 1: Detect Ecosystem

Check root for manifests (package.json, pyproject.toml, go.mod, Cargo.toml, pom.xml, build.gradle). Redirect discovery to /tmp:

```bash
ls package.json pyproject.toml setup.py go.mod go.work Cargo.toml pom.xml build.gradle nx.json turbo.json 2>/dev/null > /tmp/boot-manifests.txt
find . -maxdepth 4 -type f \( -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) -not -path "*/node_modules/*" -not -path "*/.venv/*" 2>/dev/null | head -3 > /tmp/boot-code.txt
MANIFEST_COUNT=$(wc -l < /tmp/boot-manifests.txt)
CODE_COUNT=$(wc -l < /tmp/boot-code.txt)
echo "Manifests: $MANIFEST_COUNT, Code files found: $CODE_COUNT"
```

No manifests or no code = Scaffolding Mode. Both = Scanning Mode.

Check for monorepo: JS workspaces in package.json, go.work, Cargo.toml [workspace], multiple pyproject.toml files, nx.json/turbo.json.

## Step 2: Discover Packages

Find package manifests per ecosystem. Redirect to /tmp:

```bash
find . -maxdepth 3 -type f \( -name "package.json" -o -name "pyproject.toml" -o -name "go.mod" -o -name "Cargo.toml" -o -name "build.gradle" \) -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/target/*" > /tmp/boot-packages.txt 2>&1
echo "Found $(wc -l < /tmp/boot-packages.txt) package manifests"
```

For each package, determine name, path, type (api/frontend/shared/worker/library), and stack by reading the manifest individually. Do NOT cat all manifests into context.

## Step 3: Detect Validation Commands

For each package, detect test/lint/typecheck/build/testRelated commands from manifests and config files:

| Ecosystem | test | lint | typecheck | build | testRelated |
|-----------|------|------|-----------|-------|-------------|
| JS/TS | `npm run test --workspace=<n>` or vitest/jest | `npm run lint --workspace=<n>` or eslint | `npx tsc --noEmit` (if TS) | `npm run build --workspace=<n>` | see below |
| Python | `cd <path> && pytest` | `cd <path> && ruff check .` or flake8 | `cd <path> && mypy .` (if configured) | null | null |
| Go | `cd <path> && go test ./...` | `cd <path> && golangci-lint run` | `cd <path> && go vet ./...` | `cd <path> && go build ./...` | null |
| Rust | `cd <path> && cargo test` | `cd <path> && cargo clippy` | `cd <path> && cargo check` | `cd <path> && cargo build` | null |

### testRelated Detection (JS/TS only)

`testRelated` runs only tests related to changed files — used for fast validation during builds.

- **Vitest:** `cd <path> && npx vitest --related --run`
- **Jest:** `cd <path> && npx jest --findRelatedTests`
- **Other/unknown:** `null`

Detect the test runner from `devDependencies` in the package manifest. If both vitest and jest are present, use whichever has a config file (`vitest.config.*` or `jest.config.*`). If neither is detected, set to `null`.

Read manifest scripts to detect what's configured. Use ecosystem defaults where no script exists. Set to `null` if not applicable.

Also detect root-level monorepo commands for `rootCommands` (e.g., `npm run validate` in root package.json).

## Step 4: Generate packages.json

Create `.planning/codebase/` directory if needed. Write `.planning/codebase/packages.json`:

```json
{
  "generatedAt": "<ISO>",
  "ecosystem": "<js|python|go|rust|java|polyglot>",
  "monorepo": true,
  "rootCommands": { "validateAll": "<cmd>", "buildAll": "<cmd>", "testAll": null },
  "packages": [
    {
      "serviceKey": "<unique-key>",
      "name": "<package-name>",
      "path": "<relative-path>/",
      "type": "<api|frontend|shared-ui|worker|library>",
      "stack": ["<framework>", "<orm>"],
      "manifest": "<manifest-filename>",
      "commands": {
        "test": "<cmd>",
        "lint": "<cmd>",
        "typecheck": "<cmd>",
        "build": "<cmd>",
        "testRelated": "<cmd> | null"
      }
    }
  ]
}
```

This is the single source of truth for all command execution across the workflow.

## Step 5: Generate CLAUDE.md

After scanning, generate a CLAUDE.md at the repository root. This file is the single most important artifact for code quality.

**If CLAUDE.md already exists:** Do NOT overwrite. See Re-Run Behavior above.

**If CLAUDE.md does not exist:** Generate it from bootstrap data.

### For Existing Codebases

Analyze the codebase for conventions — naming, imports, testing, error handling, component patterns. Keep it under 80 lines. Every entry must be specific enough to follow without ambiguity.

```markdown
# Project Conventions

> Auto-generated by /bootstrap on <ISO date>. Edit freely — bootstrap will not overwrite.

## Stack
- Runtime: <detected>
- Framework: <detected>
- Database: <detected from env/deps>
- Testing: <detected>
- Package manager: <detected>

## File Organization
- <detected pattern>
- <test co-location pattern>

## Naming Conventions
- Files: <detected>
- Functions/methods: <detected>
- Types/interfaces: <detected>

## Import Style
- <detected>

## Error Handling
- <detected or recommended>

## Testing Patterns
- <detected>
```

Only include sections relevant to the project. For detected patterns, cite the source inline.

### For New Projects (Scaffolding Mode)

Ask what they're building, scaffold, then generate CLAUDE.md from the scaffolded structure and user preferences.

## Step 6: Generate Architecture Overview

Write `.planning/codebase/ARCHITECTURE.md` (~50 lines):

```markdown
# Architecture Overview
> Auto-generated by /bootstrap on {date}

## Package Topology
| Package | Type | Stack | Depends On | Depended By |
|---------|------|-------|------------|-------------|
```

Populate from packages.json + manifest dependency analysis. Include:
- Technology stack summary (runtime, frameworks, database, testing, build)
- Data flow description (how requests flow, which packages communicate)
- Entry points table (dev command, main entry file per package)
- Key patterns (styling approach, state management, API client, etc.)

Read each package's main entry file and key config files to determine dependency relationships and data flow. Keep it factual and compact.

## Step 7: Generate Per-Package Registries

For **each package** in packages.json, generate a `REGISTRY-{serviceKey}.md` file in `.planning/codebase/`.

Each registry has three sections:

### Section 1: Inventory Tables

Scan the package's source code to build tables of what exists. Use Grep and Glob to find exports, then Read key files to extract signatures.

**For API/backend packages, build these tables:**

| Table | What to find | How to find it |
|-------|-------------|----------------|
| Database Models | Models, schemas, entities | Grep for `model`, `@Entity`, `Schema`, Prisma schema file |
| Services | Business logic classes/functions | Grep for `Service`, `service` in filenames |
| Routes/Controllers | Endpoint definitions | Grep for `router.get`, `app.post`, `@Controller`, route files |
| Middleware | Request interceptors | Grep for `middleware`, `use(` patterns |
| Utilities | Shared helpers | Read utils/, helpers/, lib/ directories |
| Error Classes | Custom error types | Grep for `extends Error`, `extends AppError` |

**For Frontend packages, build these tables:**

| Table | What to find | How to find it |
|-------|-------------|----------------|
| Pages & Routes | Page components + route config | Grep for `Route`, read routes/ directories |
| Shared Components | Reusable UI components | Read components/ directory, barrel exports |
| Hooks | Custom React hooks | Grep for `function use`, `const use` |
| Data Fetching / API Layer | API client functions | Read api/, services/, utils/axios files |
| Redux Slices | State management | Grep for `createSlice`, `createEntityModule` |
| Utilities | Shared helpers | Read utils/ directory |

**For Shared UI libraries, build these tables:**

| Table | What to find | How to find it |
|-------|-------------|----------------|
| Exported Components | All public components | Read main barrel export (index.ts) |
| Exported Hooks | All public hooks | Read hooks barrel export |
| Redux Utilities | State management factories | Read redux barrel export |
| Form Infrastructure | Form components/hooks | Read forms barrel export |
| Types & Interfaces | Exported type definitions | Read types barrel export |

**Column format for all tables:**

```markdown
| Name | Path | Signature | Purpose |
|------|------|-----------|---------|
| MainCard | mocho-ui/src/components/MainCard | `{ border?: boolean; children?: ReactNode; title?: ReactNode; ... }` | Card container for dashboard sections |
```

**Signature detail:** Include the actual TypeScript interface fields, not just the type name. This is what lets a subagent write correct code without reading the source file. For functions, include the full `(params) => return` signature.

### Section 2: State & Data Shapes

Document the shapes that subagents need to integrate with:

**For backend:** Database model schemas with field types, enums, and relations. Read Prisma schema, TypeORM entities, or model files.

**For frontend:** Redux state shapes, API response types, key interfaces. Read slice files and type definitions.

Format as compact TypeScript-like notation:
```markdown
## Redux State Shapes
### carrierSlice
`{ items: Carrier[], loading: LoadingState, error: Record<string, Error>, query: QueryParams }`
```

### Section 3: Representative Patterns

The most valuable section. Extract **3-5 real code snippets** (15-25 lines each) from the package that show how things are built. These are the patterns subagents must follow.

**For API/backend packages, extract:**
1. **Route/Controller pattern** — A real endpoint definition showing middleware, handler, response
2. **Service pattern** — A real service method showing business logic structure
3. **Test pattern** — A real API test showing setup, request, assertions
4. **Error handling pattern** — How errors are thrown and caught in this project
5. **Migration pattern** — A real migration file (if migrations exist)

**For Frontend packages, extract:**
1. **Page/Route pattern** — A real page component (imports, hooks, state, render structure)
2. **Component pattern** — A real reusable component (props interface, render)
3. **Data fetching pattern** — How data is loaded (saga, hook, API call)
4. **Form pattern** — How forms are built (Formik/Yup/DynamicForm usage)
5. **Test pattern** — A real component test

**For Shared UI libraries, extract:**
1. **Component export pattern** — How a shared component is structured and exported
2. **Hook pattern** — How a custom hook is built
3. **Redux utility pattern** — How factory functions (createEntityModule etc.) are used

**How to choose examples:** Pick the **most typical** implementation, not the most complex. The goal is to show the standard pattern that most new code should follow.

**Format each pattern as:**
```markdown
### Route/Controller Pattern
_Source: src/routes/carriers.ts_
```typescript
// How endpoints are defined in this project
router.get('/carriers', authenticate, async (req, res) => {
  const { page, limit } = req.query;
  const result = await carrierService.list({ page, limit, orgId: req.orgId });
  res.json({ data: result.items, meta: result.meta });
});
`` `
```

### Scanning Procedure

For each package in packages.json:

1. **Find barrel exports / entry points.** Read the package's main entry (from manifest `main` or `exports` field, or `src/index.ts`). This tells you what's publicly available.

2. **Scan source directories.** Use Glob to find source files, then Grep for key patterns (exports, class definitions, route definitions, hooks). Redirect discovery commands to /tmp.

3. **Read key files individually.** For each discovered export/component/service, read the source file to extract the interface/signature. Do NOT read every file — focus on the ones that appear in exports or route definitions.

4. **Extract representative patterns.** For each pattern type, find the best example file and extract a 15-25 line snippet that shows the complete pattern.

5. **Build the registry.** Assemble tables + state shapes + patterns into `.planning/codebase/REGISTRY-{serviceKey}.md`.

**Output management:** All find/grep commands redirect to /tmp. Only read individual source files as needed. Target ~1,500-2,500 tokens per registry.

## Step 8: Generate Registry Index

Write `.planning/codebase/REGISTRY.md`:

```markdown
# Code Registry Index
> Auto-generated by /bootstrap on {date}

| Package | Type | Registry File | Components | Hooks | Services | Patterns |
|---------|------|---------------|------------|-------|----------|----------|
| mocho-ui | shared-ui | REGISTRY-mocho-ui.md | 25 | 8 | — | 3 |
| dispatch-ui | frontend | REGISTRY-dispatch-ui.md | 4 | 2 | — | 5 |
| dispatch-api | api | REGISTRY-dispatch-api.md | — | — | 6 | 5 |
```

This gives the orchestrator a quick overview of what's available before reading individual registries.

## Step 9: Report

Print comprehensive bootstrap report:

```
Bootstrap complete:
  Ecosystem: <detected>
  Packages: <count>
  CLAUDE.md: <generated | preserved>

  Architecture: .planning/codebase/ARCHITECTURE.md
  Registries:
    REGISTRY-mocho-ui.md      — 25 components, 8 hooks, 3 patterns
    REGISTRY-dispatch-ui.md   — 4 components, 2 hooks, 5 patterns
    REGISTRY-dispatch-api.md  — 6 services, 12 routes, 5 patterns

  Validation commands:
    mocho-ui:     test=npm run test  testRelated=npx jest --findRelatedTests
    dispatch-ui:  test=npm run test  testRelated=npx jest --findRelatedTests
    dispatch-api: test=npm run test  testRelated=npx jest --findRelatedTests

  Output: .planning/codebase/
  If any commands are wrong, edit packages.json before running /build.
Next: /feature-init <name> or /prd-refine <name>
```

---

## Scaffolding Mode

If no existing code detected, ask:

1. What are you building? (API, frontend, full-stack)
2. What language/framework?
3. Project name?
4. Monorepo or single package?

Scaffold project structure, install dependencies, init git, then run Scanning Mode above.
