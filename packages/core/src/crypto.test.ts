import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './crypto.js';

const TEST_KEY = 'a'.repeat(64); // 32 bytes hex = 64 hex chars

describe('AES-256-GCM encrypt/decrypt', () => {
  beforeEach(() => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY;
  });

  afterEach(() => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY; // restore to avoid cross-test leakage
  });

  it('round-trips plaintext correctly', () => {
    const plain = 'Banque Populaire|000123456789012345678901|Ahmed Fellah';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('round-trips JSON bank details', () => {
    const details = { bankName: 'CIH', rib: '230780123456789012345678', accountHolder: 'Mehdi' };
    const encoded = encrypt(JSON.stringify(details));
    expect(JSON.parse(decrypt(encoded))).toEqual(details);
  });

  it('produces different ciphertext on each call (random IV)', () => {
    const plain = 'same-input';
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plain);
    expect(decrypt(b)).toBe(plain);
  });

  it('throws on tampered ciphertext', () => {
    const enc = encrypt('hello');
    const buf = Buffer.from(enc, 'base64url');
    buf[buf.length - 1]! ^= 0xff; // flip last byte (TS non-null assertion; index is always valid)
    expect(() => decrypt(buf.toString('base64url'))).toThrow();
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    process.env['ENCRYPTION_KEY'] = '';
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY');
  });

  it('throws on ciphertext that is too short', () => {
    expect(() => decrypt(Buffer.from('tooshort').toString('base64url'))).toThrow();
  });
});
