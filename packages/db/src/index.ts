import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

function createDb() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export const db = createDb();
export type Database = ReturnType<typeof createDb>;
