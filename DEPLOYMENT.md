# Deploy from GitHub to Vercel

No local development environment is required. Vercel builds this repository; Convex hosts the database, backend functions and authentication.

## Accounts and production backend

1. Create or select the intended project at https://dashboard.convex.dev. Access to GitHub does not grant access to Convex; ask the team admin for an invitation if using an existing project.
2. Select/create its Production deployment.
3. Generate a production deploy key in Deployment Settings. It must allow deployment of functions.
4. Import axellaban/slack-clone at https://vercel.com/new. Use Next.js, the repository root and main as the production branch. Keep the repository build command: sh vercel.sh.
5. In Vercel add CONVEX_DEPLOY_KEY as a sensitive variable scoped ONLY to Production. Never commit the key.

The build uses the installed Convex CLI, deploys the backend and passes its URL to Next.js as NEXT_PUBLIC_CONVEX_URL. You do not need a local .env.local or a development CONVEX_DEPLOYMENT on Vercel.

## Authentication

Login/signup needs a matching JWT_PRIVATE_KEY and JWKS pair plus SITE_URL on the Convex deployment. The build initializes them: when CONVEX_DEPLOY_KEY is set, vercel.sh runs scripts/setup-convex-env.mjs, which generates the key pair and sets SITE_URL (the Vercel production URL) only if they are missing. Existing values are never overwritten, and the values are piped to the Convex CLI so they do not appear in build logs.

These live in Convex Deployment Settings > Environment Variables, not in the repository. If the app moves to a custom domain, update SITE_URL there.

For Google/GitHub OAuth also set:
- AUTH_GITHUB_ID and AUTH_GITHUB_SECRET for GitHub
- AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET for Google

Register the corresponding callback URL at each provider:
- https://<production-deployment>.convex.site/api/auth/callback/github
- https://<production-deployment>.convex.site/api/auth/callback/google

Use the HTTP Actions URL from the Convex dashboard for callbacks (.convex.site), not the database client URL (.convex.cloud). Email/password authentication does not need OAuth credentials. The UI currently exposes all three login options, so OAuth buttons will not work until those providers are configured.

## Preview deployments

Never expose the production deploy key to Preview builds. Use a separate Convex preview deploy key scoped to Vercel Preview; the build supports it and initializes the auth variables for each preview deployment the same way.

Alternatively set NEXT_PUBLIC_CONVEX_URL for Preview to a separate, already-deployed development backend. In that mode only the frontend is built: backend changes in the preview are not deployed. Without either setting, the build stops with an explanatory error.

## Verification after deployment

- Confirm the Vercel build succeeds and the expected Convex functions/tables are present.
- Test email/password signup, login, logout and login again.
- Create a workspace/channel and send a message.
- Test realtime updates in a second browser session.
- Test Google/GitHub only after OAuth credentials and callbacks are configured.

The shell build routing was checked with a mock CLI. Full installation, production build and end-to-end authentication still require the connected Vercel/Convex environments.

## Official references

- https://docs.convex.dev/production/hosting/vercel
- https://labs.convex.dev/auth/production
- https://labs.convex.dev/auth/setup/manual
- https://labs.convex.dev/auth/config/oauth/github
- https://labs.convex.dev/auth/config/oauth/google
