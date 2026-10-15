# Deploy pipeline

## Code path

`.github/workflows/ci.yml` has two jobs.

1. **Checks** run on every pull request and on every push to `main`. They install with `pnpm install --frozen-lockfile` on the Node version in `.node-version` and the pnpm version in `package.json`. Then they run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. A failed e2e run uploads the Playwright report.
2. **Deploy** runs only after the checks pass, and only for pushes to `main` or pull requests from this repository (pull requests from forks get no secrets).
   - `vercel pull` downloads the project settings for the target environment: `preview` for pull requests, `production` for `main`.
   - `vercel build` (with `--prod` for production) builds into `.vercel/output` on the runner, with Node 26 and pnpm 12.
   - `vercel deploy --prebuilt` uploads that output. Vercel does not rebuild it.
   - The deployment URL goes to the job summary and to the GitHub environment (`preview` or `production`). That makes the pull request page show a "View deployment" button.

`vercel.json` sets `git.deploymentEnabled: false`, so Vercel never builds the same push itself. The repository is not connected to the Vercel project.

## Why it is shaped this way

Vercel's own builds offer Node 24 and 22 and pnpm 6 to 10, so they cannot use the project's Node 26 and pnpm 12 (ADR 0003). Building on GitHub's runner keeps one toolchain everywhere, and running deploy after checks means a failing commit never goes live. Functions still run on Vercel's Node 24, picked from the project's Node.js Version setting. That is why `package.json` has no `engines.node`: a range matching only Node 26 makes Vercel's build tooling fail.

## What would break it

- Adding `engines.node` with a Node 26-only range: `vercel build` fails with `BUILD_UTILS_NODE_VERSION_INVALID`.
- Missing or expired `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` secrets: the deploy job fails at `vercel pull`.
- Connecting the GitHub repository in Vercel and removing the `vercel.json` guard: every push would also start a Vercel build that cannot use Node 26 and pnpm 12.
- Changing the project's Node.js Version in Vercel to something the code does not support: functions run on that version.
- Bumping the Vercel CLI without checking `vercel build` on Node 26.
