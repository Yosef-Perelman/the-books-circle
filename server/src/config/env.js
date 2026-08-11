import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CLIENT_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_STORAGE_BUCKET: z.string().default('book-scans'),
  GEMINI_API_KEY: z.string().min(10).optional(),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_VISION_MODEL: z.string().default('gemini-2.0-flash'),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
