import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 10,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;

// RLS helper: sets app.current_user_id and app.current_user_role for the duration
// of the transaction so Postgres RLS policies can read them.
export async function withUserContext<T>(
  userId: string,
  role: string,
  fn: (tx: DB) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}'`);
    await tx.execute(`SET LOCAL app.current_user_role = '${role.replace(/'/g, "''")}'`);
    return fn(tx as unknown as DB);
  });
}
