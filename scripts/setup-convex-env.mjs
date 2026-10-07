// Ensures the Convex deployment targeted by CONVEX_DEPLOY_KEY has the
// environment variables Convex Auth needs (JWT_PRIVATE_KEY, JWKS, SITE_URL) and
// the VAPID keys used for web push notifications.
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

// Web push (VAPID) key pair, in the raw base64url format browsers and web-push expect.
if (!existing.has('VAPID_PUBLIC_KEY') || !existing.has('VAPID_PRIVATE_KEY')) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const { x, y } = publicKey.export({ format: 'jwk' });
  const { d } = privateKey.export({ format: 'jwk' });
  const rawPublicKey = Buffer.concat([Buffer.from([4]), Buffer.from(x, 'base64url'), Buffer.from(y, 'base64url')]);

  existing.delete('VAPID_PUBLIC_KEY');
  existing.delete('VAPID_PRIVATE_KEY');
  setIfMissing('VAPID_PUBLIC_KEY', rawPublicKey.toString('base64url'));
  setIfMissing('VAPID_PRIVATE_KEY', d);
}

const vercelHost =
  process.env.VERCEL_ENV === 'production'
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);
const siteUrl = process.env.SITE_URL ?? (vercelHost && `https://${vercelHost}`);

if (siteUrl) setIfMissing('SITE_URL', siteUrl);
else if (!existing.has('SITE_URL')) console.warn('Convex env: SITE_URL is not set and could not be inferred.');
