// Este módulo es dueño de TODOS los secretos (RESEND_*, TWTAPI_KEY). server-only
// garantiza que un import accidental desde un Client Component rompa el build.
import 'server-only';

import { z } from 'zod';
import { Logger } from '@/lib/logger';

const envSchema = z.object({
  // Server-side variables
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_TO_EMAIL: z.string().email().optional(),
  TWTAPI_KEY: z.string().min(1).optional(),

  // Panel /admin. Si faltan, el panel falla cerrado: sin contraseña no hay
  // sesión posible y sin token no se llama a GitHub.
  ADMIN_PASSWORD: z.string().min(1).optional(),
  ADMIN_SECRET: z.string().min(16).optional(),
  GITHUB_TOKEN: z.string().min(1).optional(),
  // Repo que edita el panel. En el copy de Cloudflare apunta a portfolio-cf;
  // en el original cae al repo histórico.
  GITHUB_REPO: z.string().min(1).optional(),
  // Solo para probar contra una rama de tiro; en producción se usa master.
  GITHUB_BRANCH: z.string().min(1).optional(),

  // Client-side variables (with defaults for production)
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://www.wsalas.com'),
});

const parsedEnv = envSchema.safeParse(process.env);

export const env = parsedEnv.success ? parsedEnv.data : {
  RESEND_API_KEY: undefined,
  RESEND_FROM_EMAIL: undefined,
  RESEND_TO_EMAIL: undefined,
  TWTAPI_KEY: undefined,
  ADMIN_PASSWORD: undefined,
  ADMIN_SECRET: undefined,
  GITHUB_TOKEN: undefined,
  GITHUB_REPO: 'wsalas19/portfolio-cf',
  GITHUB_BRANCH: undefined,
  NEXT_PUBLIC_SITE_URL: 'https://www.wsalas.com'
};

// Validate on import (throws in development if missing)
if (process.env.NODE_ENV === 'development') {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    Logger.error(
      error instanceof Error ? error : new Error(String(error)),
      { context: 'Environment validation failed in development' },
    );
    throw error;
  }
}
