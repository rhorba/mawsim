import { SignupSchema } from '@mawsim/core';
import { db } from '@mawsim/db';
import { users } from '@mawsim/db/schema';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name, role, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Argon2id — OWASP recommended KDF for passwords
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 4,
    });

    const [user] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name,
        role,
        phone: phone ?? null,
        emailVerified: null,
        isActive: true,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    return NextResponse.json({ userId: user?.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
