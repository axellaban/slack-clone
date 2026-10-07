#!/bin/sh
set -eu

if [ -n "${CONVEX_DEPLOY_KEY:-}" ]; then
  # Make sure Convex Auth has its keys and SITE_URL before deploying.
  node scripts/setup-convex-env.mjs
  # Use the repository's installed CLI and inject the matching backend URL.
  exec pnpm exec convex deploy --cmd 'pnpm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
fi

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Missing CONVEX_DEPLOY_KEY. Add a production deploy key in Vercel (Production scope)." >&2
  exit 1
fi

if [ -z "${NEXT_PUBLIC_CONVEX_URL:-}" ]; then
  echo "Preview requires a Convex preview deploy key or NEXT_PUBLIC_CONVEX_URL for a separate development backend." >&2
  exit 1
fi

exec pnpm run build
