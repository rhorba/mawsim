// Pure review validation logic — DB/persistence lives in the web server-action layer.

export class ReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewError';
  }
}

export function validateRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewError('La note doit être un entier entre 1 et 5.');
  }
}

export function validateComment(comment: string | undefined): void {
  if (comment !== undefined && comment.length > 1000) {
    throw new ReviewError('Le commentaire ne peut pas dépasser 1000 caractères.');
  }
}
