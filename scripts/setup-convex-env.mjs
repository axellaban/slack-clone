// Ensures the Convex deployment targeted by CONVEX_DEPLOY_KEY has the
// environment variables Convex Auth needs (JWT_PRIVATE_KEY, JWKS, SITE_URL).
// Existing values are never overwritten, so it is safe to run on every build.
import { execFileSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';

const convex = (args, input) =>
  execFileSync('pnpm', ['exec', 'convex', ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
  });

const existing = new Set(
  convex(['env', 'list'])
    .split('\n')
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean),
);

// Values are piped through stdin so they never show up in build logs.
const setIfMissing = (name, value) => {
  if (existing.has(name)) return;
  convex(['env', 'set', name], value);
  console.log(`Convex env: set ${name}`);
};

if (!existing.has('JWT_PRIVATE_KEY') || !existing.has('JWKS')) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey.export({ format: 'jwk' }) }] });

  // The key pair must match, so replace both together.
  existing.delete('JWT_PRIVATE_KEY');
  existing.delete('JWKS');
  setIfMissing('JWT_PRIVATE_KEY', pem.trimEnd().replace(/\n/g, ' '));
  setIfMissing('JWKS', jwks);
}

const vercelHost =
  process.env.VERCEL_ENV === 'production'
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);
const siteUrl = process.env.SITE_URL ?? (vercelHost && `https://${vercelHost}`);

if (siteUrl) setIfMissing('SITE_URL', siteUrl);
else if (!existing.has('SITE_URL')) console.warn('Convex env: SITE_URL is not set and could not be inferred.');
