import type { ProductCategory, QualityGrade } from '@mawsim/core';

// Embedding dimensionality — must match the pgvector column (listings/rfqs: 384).
export const EMBEDDING_DIM = 384;

/**
 * Deterministic, local product embedding — NO external ML (stack §5).
 *
 * We feature-hash a bag of normalized tokens (category, variety, grade, region,
 * description words) into a fixed 384-dim vector and L2-normalize it. Products
 * that share tokens land closer in cosine space, which is all RFQ matching needs.
 * Being deterministic, it is fully reproducible and unit-testable (no fixtures,
 * no network, no model weights).
 */
export type ProductEmbeddingInput = {
  productCategory: ProductCategory;
  productVariety?: string | null;
  qualityGrade?: QualityGrade | null;
  region?: string | null;
  description?: string | null;
};

// FNV-1a 32-bit — small, fast, well-distributed for short token strings.
function fnv1a(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    // hash *= 16777619, kept in 32-bit unsigned range
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // strip combining diacritics so "Meknès" ~ "meknes"
    .split(/[^\p{L}\p{N}]+/u) // keep letters + digits (latin + arabic)
    .filter((t) => t.length > 1);
}

export function embedProduct(input: ProductEmbeddingInput): number[] {
  const tokens: string[] = [];

  // Weight structured fields higher than free-text by repeating their tokens.
  tokens.push(`cat:${input.productCategory}`, `cat:${input.productCategory}`);
  if (input.qualityGrade) tokens.push(`grade:${input.qualityGrade}`);
  if (input.region) {
    for (const t of tokenize(input.region)) tokens.push(`reg:${t}`, `reg:${t}`);
  }
  if (input.productVariety) {
    for (const t of tokenize(input.productVariety)) tokens.push(`var:${t}`, `var:${t}`);
  }
  if (input.description) {
    for (const t of tokenize(input.description)) tokens.push(t);
  }

  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  for (const token of tokens) {
    const h = fnv1a(token);
    const idx = h % EMBEDDING_DIM;
    // Sign bit decorrelates collisions (signed feature hashing trick).
    const sign = (h >>> 16) & 1 ? 1 : -1;
    vec[idx] = (vec[idx] ?? 0) + sign;
  }

  // L2-normalize so cosine similarity == dot product downstream.
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec; // empty input — zero vector
  for (let i = 0; i < vec.length; i++) vec[i] = (vec[i] ?? 0) / norm;
  return vec;
}

/** Cosine similarity of two equal-length vectors (assumes finite numbers). */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
