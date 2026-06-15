import { getContractData } from '@/server/negotiation';
import { AuthorizationError, UnauthenticatedError } from '@mawsim/core';
import { generateContractPDF } from '@mawsim/marketplace';
import { NextResponse } from 'next/server';

// @react-pdf/renderer is Node-only (pdfkit) — never the edge runtime.
export const runtime = 'nodejs';

/** Download the bilingual FR/AR purchase contract for a deal (party-scoped). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const data = await getContractData(id);
    const pdf = await generateContractPDF(data);

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="contrat-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }
    if (
      err instanceof Error &&
      (err.name === 'NegotiationError' || err.message.includes('introuvable'))
    ) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error('[contract route]', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
