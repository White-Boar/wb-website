# GitHub Actions CI/CD Pipeline

This directory contains the GitHub Actions workflow configuration for automated testing and deployment to Vercel.

## Overview

The CI/CD pipeline automatically:
- ✅ Runs linting and unit tests
- 🏗️ Builds the application using Vercel CLI
- 🚀 Deploys to Vercel (preview for PRs, production for main branch)
- 🧪 Runs E2E tests against the deployed preview
- 💬 Comments deployment URLs and test results on PRs

## Workflow: `test.yml`

### Jobs

#### 1. `test-build-deploy`
**Purpose:** Test, build, and deploy the application

**Steps:**
1. Checkout code and setup Node.js with pnpm
2. Cache Next.js build for faster subsequent runs
3. Install dependencies
4. Pull Vercel environment configuration
5. Run ESLint
6. Run unit tests (`pnpm test:ci`)
7. Build with Vercel CLI (`vercel build`)
8. Deploy to Vercel (`vercel deploy --prebuilt`)
9. Comment deployment URL on PR (for preview deployments)
10. Upload build artifacts

**Outputs:**
- `deployment-url`: The URL of the deployed preview/production site

#### 2. `e2e-tests`
**Purpose:** Run E2E tests against the deployed application

**Steps:**
1. Checkout code and setup Node.js with pnpm
2. Install dependencies
3. Cache and install Playwright browsers
4. Pull Vercel environment for E2E tests
5. Run Playwright E2E tests against deployed URL
6. Upload Playwright report (always, even on failure)
7. Comment test results on PR

**Depends on:** `test-build-deploy`

### Triggers

- **Push to `main` or `develop`:** Full CI/CD pipeline with production/preview deployment
- **Pull Request to `main`:** Preview deployment + E2E tests with PR comments

### Environment Variables

Required GitHub Secrets:
- `VERCEL_TOKEN`: Vercel API token for authentication
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Caching Strategy

**Next.js Build Cache:**
- Caches `.next/cache` directory
- Key based on pnpm lockfile + source file hashes
- Significantly speeds up subsequent builds

**Playwright Browsers Cache:**
- Caches `~/.cache/ms-playwright` directory
- Key based on Playwright version
- Avoids re-downloading ~500MB of browser binaries

### Deployment Strategy

**Preview Deployments (PRs):**
```bash
vercel build --token=$VERCEL_TOKEN
vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

**Production Deployments (main branch):**
```bash
vercel build --prod --token=$VERCEL_TOKEN
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### E2E Testing

E2E tests run against the deployed Vercel preview URL, not a local server:
- More realistic testing environment
- Tests actual deployment configuration
- No need to start local dev server in CI
- Uses `BASE_URL` environment variable to target deployment

### PR Comments

The workflow automatically comments on PRs with:
1. **Deployment URL:** Immediately after successful deployment
2. **E2E Test Results:** After E2E tests complete (pass or fail)

Example:
```markdown
### 🚀 Preview Deployment Ready!

**URL:** https://wb-website-git-feature-branch.vercel.app

✅ Build completed successfully. You can now test your changes on the preview deployment.

---

### E2E Tests ✅ passed

Tests were run against: https://wb-website-git-feature-branch.vercel.app
```

## Local Testing

To test the workflow locally:

### Run unit tests:
```bash
pnpm test:ci
```

### Run E2E tests (local server):
```bash
pnpm test:e2e
```

### Run E2E tests (against deployed URL):
```bash
BASE_URL=https://your-deployment.vercel.app pnpm test:e2e
```

## Performance Benefits

**Before (old workflow):**
- Duplicate builds in test and build jobs
- No Next.js cache
- Playwright browsers downloaded every run
- E2E tests against local production server

**After (new workflow):**
- ✅ Single build step
- ✅ Next.js build cache (~30% faster builds)
- ✅ Playwright browsers cached (~2min saved per run)
- ✅ E2E tests against live Vercel deployment
- ✅ Automatic deployment on every push/PR
- ✅ PR comments with deployment URLs and test results

**Estimated time savings:** ~40-50% reduction in CI time

## Troubleshooting

### Vercel CLI Issues
If deployment fails, ensure secrets are set correctly:
```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

### E2E Tests Failing
Check that the BASE_URL is accessible:
```bash
curl -I $BASE_URL
```

### Cache Issues
If builds are failing due to cache, you can clear caches:
- Go to Actions → Select workflow → Caches
- Delete the problematic cache entry

## References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions with Vercel Guide](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
