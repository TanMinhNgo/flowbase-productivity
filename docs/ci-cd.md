# CI/CD

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `main`.
It installs locked dependencies, runs `npm run typecheck`, and creates a production build.

## Continuous deployment

`.github/workflows/deploy.yml` deploys the exact commit from `main` only after the `CI` workflow succeeds and GitHub approves the `production` environment. It can also be triggered manually from the Actions tab.

Create a Vercel project for this repository, then add these GitHub Actions secrets:

- `VERCEL_TOKEN`: a Vercel token with deployment access.
- `VERCEL_ORG_ID`: the Vercel team or personal account ID.
- `VERCEL_PROJECT_ID`: the linked Flowbase Vercel project ID.

Add the production application variables, such as `DATABASE_URL`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, in the Vercel project environment settings. They are pulled securely during the deployment workflow and are never stored in the repository.
