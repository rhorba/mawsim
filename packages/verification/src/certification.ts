// Certification document verification workflow — Sprint 6
// Documents stored in R2 private bucket; served via signed URLs; admin + owner only

export type CertVerificationStatus = 'pending' | 'approved' | 'rejected';

export async function submitCertification(_params: {
  farmerId: string;
  type: string;
  documentKey: string;
  issuedBy: string;
  validUntil: Date;
}): Promise<void> {
  throw new Error('Certification submission not yet implemented — Sprint 6');
}

export async function verifyCertification(_params: {
  certificationId: string;
  adminId: string;
  status: 'approved' | 'rejected';
  note?: string;
}): Promise<void> {
  throw new Error('Certification verification not yet implemented — Sprint 6');
}
