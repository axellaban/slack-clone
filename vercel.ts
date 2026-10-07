import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  trailingSlash: false,
  buildCommand: 'sh vercel.sh',
};
