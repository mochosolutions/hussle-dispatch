# npm link Setup Guide

This project has migrated from npm workspaces to `npm link` for local package development.

## One-Time Setup

Run these commands once to establish the npm link:

```bash
# Navigate to the mocho-ui library
cd mocho-ui

# Create a global symlink for @mocho/ui
npm link

# Navigate to the dispatch UI app
cd ../hussle-app-dispatch-ui

# Link the global @mocho/ui package
npm link @mocho/ui

# Verify the link is active
npm link @mocho/ui --list
```

You should see output like:

```
active modules:
  @mocho/ui -> /Users/jr/Development/hustle-app/fleet-command/mocho-ui
```

## Development Workflow

Once npm link is set up, use this workflow for local development:

### Terminal 1: Build mocho-ui with watch mode

```bash
cd mocho-ui
npm run build:watch
```

This automatically rebuilds the library whenever you make changes to source files in `mocho-ui/src/`.

### Terminal 2: Run dispatch-ui dev server

```bash
cd hussle-app-dispatch-ui
npm run dev
```

The app will use the linked mocho-ui package and see updates as they're built.

### Terminal 3 (Optional): Run Storybook for mocho-ui

```bash
cd mocho-ui
npm run dev
```

This runs Storybook on port 6006 for component development and testing.

## How It Works

- `npm link` creates a symbolic link in mocho-ui's global npm cache
- `npm link @mocho/ui` in dispatch-ui creates a symlink in `node_modules/@mocho/ui` pointing to the actual mocho-ui directory
- When you run `npm run build:watch` in mocho-ui, it rebuilds `dist/` which dispatch-ui consumes via the symlink
- TypeScript finds types at `node_modules/@mocho/ui/dist/types/` (from tsconfig.json paths)
- Vite finds components at `node_modules/@mocho/ui` or via the Docker alias for HMR

## Docker Development

Docker volume mounts work with npm link:

```bash
docker compose up --build
```

The volume mounts in `docker-compose.yml` point to `./mocho-ui/src` for hot module replacement during development.

## Unlinking

If you need to unlink the package (e.g., to switch back to a different workflow):

```bash
# In dispatch-ui
cd hussle-app-dispatch-ui
npm unlink @mocho/ui

# In mocho-ui
cd ../mocho-ui
npm unlink
```

Then reinstall normally:

```bash
cd hussle-app-dispatch-ui
npm install
```

## Troubleshooting

**Build not updating in dispatch-ui:**

- Ensure `npm run build:watch` is running in the mocho-ui terminal
- Check the `dist/` folder in mocho-ui has the latest files
- Clear the dispatch-ui browser cache (Cmd/Ctrl + Shift + R)

**TypeScript errors on @mocho/ui imports:**

- Verify the npm link is active: `npm link @mocho/ui --list`
- Check that `node_modules/@mocho/ui` is a symlink: `ls -la node_modules/@mocho/ui`
- Clear TypeScript cache: `rm -rf node_modules/.tmp` and restart TypeScript server

**Stale npm link:**

- Unlink and re-establish: `npm unlink @mocho/ui` then `npm link @mocho/ui`

## Notes

- The root `package.json` no longer uses npm workspaces
- Each package is independent and can be installed/developed separately
- ESLint configuration has been updated to handle multiple tsconfig candidates
- The `@mocho/ui` package exports multiple entry points (redux, forms, components, hooks, utils, types)
