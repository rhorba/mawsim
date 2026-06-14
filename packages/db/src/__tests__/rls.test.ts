/**
 * RLS role-isolation integration tests (Sprint 1, S1-10).
 *
 * Connects as the application role (mawsim_app) — NOT the DB owner — so the
 * Postgres RLS policies are actually enforced (owners bypass RLS). Verifies:
 *   - a farmer sees only their own farmer_profile (bank details protected)
 *   - a buyer cannot read ANY farmer_profile (bank details 403-equivalent)
 *   - a buyer cannot read farmer_certifications (private cert-doc keys)
 *   - the access_audit_logs table is admin-only on read
 *
 * Gated on DATABASE_URL: skipped automatically when no DB is configured
 * (e.g. local runs without Postgres). CI provides pgvector/pgvector:pg16.
 */
import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const DATABASE_URL = process.env['DATABASE_URL'];
const APP_USER = 'mawsim_app';
const APP_PASS = 'mawsim_app_password';

function appConnectionString(url: string): string {
  const parsed = new URL(url);
  parsed.username = APP_USER;
  parsed.password = APP_PASS;
  return parsed.toString();
}

const describeIf = DATABASE_URL ? describe : describe.skip;

describeIf('RLS role isolation', () => {
  let owner: Pool;
  let app: Pool;

  const farmerAUser = randomUUID();
  const farmerBUser = randomUUID();
  const buyerUser = randomUUID();
  const farmerAProfile = randomUUID();
  const farmerBProfile = randomUUID();
  const buyerProfile = randomUUID();
  const certId = randomUUID();

  beforeAll(async () => {
    owner = new Pool({ connectionString: DATABASE_URL });
    app = new Pool({ connectionString: appConnectionString(DATABASE_URL as string) });

    // Seed as owner (bypasses RLS).
    await owner.query(
      `INSERT INTO users (id, email, name, role) VALUES
        ($1,$2,'Farmer A','farmer'),
        ($3,$4,'Farmer B','farmer'),
        ($5,$6,'Buyer','buyer')`,
      [
        farmerAUser,
        `rls-a-${farmerAUser}@test.local`,
        farmerBUser,
        `rls-b-${farmerBUser}@test.local`,
        buyerUser,
        `rls-c-${buyerUser}@test.local`,
      ]
    );
    await owner.query(
      `INSERT INTO farmer_profiles (id, user_id, farm_name, region, bank_details_encrypted) VALUES
        ($1,$2,'Farm A','Fès-Meknès','SECRET-A'),
        ($3,$4,'Farm B','Souss-Massa','SECRET-B')`,
      [farmerAProfile, farmerAUser, farmerBProfile, farmerBUser]
    );
    await owner.query(
      `INSERT INTO buyer_profiles (id, user_id, company_name, sector, city) VALUES
        ($1,$2,'Buyer Co','processor','Casablanca')`,
      [buyerProfile, buyerUser]
    );
    await owner.query(
      `INSERT INTO farmer_certifications (id, farmer_id, type, issued_by, valid_until, document_key)
        VALUES ($1,$2,'organic','Ecocert',now() + interval '1 year','certs/secret-doc.pdf')`,
      [certId, farmerAProfile]
    );
  });

  afterAll(async () => {
    await owner.query('DELETE FROM farmer_certifications WHERE id = $1', [certId]);
    await owner.query('DELETE FROM farmer_profiles WHERE id = ANY($1)', [
      [farmerAProfile, farmerBProfile],
    ]);
    await owner.query('DELETE FROM buyer_profiles WHERE id = $1', [buyerProfile]);
    await owner.query('DELETE FROM users WHERE id = ANY($1)', [
      [farmerAUser, farmerBUser, buyerUser],
    ]);
    await owner.end();
    await app.end();
  });

  /** Run a query as the app role with RLS context set for the transaction. */
  async function asUser<T>(
    userId: string,
    role: string,
    fn: (c: PoolClient) => Promise<T>
  ): Promise<T> {
    const c = await app.connect();
    try {
      await c.query('BEGIN');
      await c.query(`SET LOCAL app.current_user_id = '${userId}'`);
      await c.query(`SET LOCAL app.current_user_role = '${role}'`);
      const result = await fn(c);
      await c.query('ROLLBACK');
      return result;
    } finally {
      c.release();
    }
  }

  it('farmer sees only their own farmer_profile', async () => {
    const rows = await asUser(farmerAUser, 'farmer', async (c) => {
      const r = await c.query('SELECT id, bank_details_encrypted FROM farmer_profiles');
      return r.rows;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(farmerAProfile);
    expect(rows[0].bank_details_encrypted).toBe('SECRET-A');
  });

  it('farmer A cannot see farmer B (bank details isolated)', async () => {
    const rows = await asUser(farmerAUser, 'farmer', async (c) => {
      const r = await c.query('SELECT id FROM farmer_profiles WHERE id = $1', [farmerBProfile]);
      return r.rows;
    });
    expect(rows).toHaveLength(0);
  });

  it('buyer cannot read ANY farmer_profile (bank details protected)', async () => {
    const rows = await asUser(buyerUser, 'buyer', async (c) => {
      const r = await c.query('SELECT id FROM farmer_profiles');
      return r.rows;
    });
    expect(rows).toHaveLength(0);
  });

  it('buyer cannot read farmer_certifications (private cert-doc keys)', async () => {
    const rows = await asUser(buyerUser, 'buyer', async (c) => {
      const r = await c.query('SELECT document_key FROM farmer_certifications');
      return r.rows;
    });
    expect(rows).toHaveLength(0);
  });

  it('admin can read all farmer_profiles', async () => {
    const rows = await asUser(randomUUID(), 'admin', async (c) => {
      const r = await c.query('SELECT id FROM farmer_profiles WHERE id = ANY($1)', [
        [farmerAProfile, farmerBProfile],
      ]);
      return r.rows;
    });
    expect(rows).toHaveLength(2);
  });

  it('access_audit_logs is not readable by non-admin', async () => {
    const rows = await asUser(farmerAUser, 'farmer', async (c) => {
      const r = await c.query('SELECT * FROM access_audit_logs');
      return r.rows;
    });
    expect(rows).toHaveLength(0);
  });
});
