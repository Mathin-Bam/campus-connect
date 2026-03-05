import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT is required'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  AWS_SES_REGION: z.string().min(1, 'AWS_SES_REGION is required'),
  AWS_SES_FROM_EMAIL: z.string().email('AWS_SES_FROM_EMAIL must be a valid email'),
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error('❌ Environment validation failed:');
      console.error(missingVars.join('\n'));
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    console.error('❌ Unknown environment validation error:', error);
    process.exit(1);
  }
}

export const env = validateEnv();
export { validateEnv };
