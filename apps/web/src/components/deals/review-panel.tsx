'use client';

import { Button } from '@/components/ui/button';
import { postReview } from '@/server/reviews';
import { useState } from 'react';

interface ReviewPanelProps {
  dealId: string;
  alreadyReviewed: boolean;
  counterpartyName: string;
}

export function ReviewPanel({ dealId, alreadyReviewed, counterpartyName }: ReviewPanelProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyReviewed);
  const [error, setError] = useState('');

  if (done) {
    return (
      <p className="text-sm text-[var(--color-secondary)] font-medium">
        ✓ Évaluation soumise — merci pour votre retour.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Veuillez sélectionner une note.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await postReview({ dealId, rating, comment: comment || undefined });
    setLoading(false);
    if (res.success) {
      setDone(true);
    } else {
      setError(res.error);
    }
  }

  const activeRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-base font-semibold text-[var(--color-foreground)]">
        Évaluer {counterpartyName}
      </h3>

      {/* Star rating — hidden radio inputs for semantics, visual star overlay */}
      <fieldset className="flex gap-1">
        <legend className="sr-only">Note de 1 à 5</legend>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            className="cursor-pointer text-2xl leading-none transition-transform hover:scale-110 select-none"
            style={{ color: star <= activeRating ? '#C8873A' : '#D1C9BC' }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <input
              type="radio"
              name="rating"
              value={star}
              checked={rating === star}
              onChange={() => setRating(star)}
              className="sr-only"
            />
            ★
          </label>
        ))}
      </fieldset>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire optionnel (max 1000 caractères)"
        maxLength={1000}
        rows={3}
        className="w-full text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? 'Envoi…' : 'Soumettre l’évaluation'}
      </Button>
    </form>
  );
}
