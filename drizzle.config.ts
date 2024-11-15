import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default {
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  dbCredentials: {
    host: 'ep-shiny-bonus-a52t43t4.us-east-2.aws.neon.tech',
    database: 'neondb',
    user: 'neondb_owner',
    password: 'lt6RzUK1IcfM',
    port: 5432, // PostgreSQL default port
    ssl: true, // Optional: Add if SSL is required
  },
} satisfies Config;
