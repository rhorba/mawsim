// Pure domain guards for admin operations.
// No DB imports — stateless validation only.

export class AdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminValidationError';
  }
}

export function assertDealIsDisputed(status: string): void {
  if (status !== 'disputed') {
    throw new AdminValidationError("La transaction n'est pas en litige.");
  }
}

export function assertPricePositiveInteger(pricePerQtx: number): void {
  if (!Number.isInteger(pricePerQtx) || pricePerQtx <= 0) {
    throw new AdminValidationError('Prix invalide — entier positif requis (centimes MAD).');
  }
}
