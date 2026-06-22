// Email notifications via Resend.
// Skips gracefully when RESEND_API_KEY is absent (dev/test without email).

import { Resend } from 'resend';

export type EmailTemplate =
  | 'deal_confirmed'
  | 'payment_received'
  | 'delivery_reminder'
  | 'offer_received'
  | 'price_alert';

type Locale = 'fr' | 'ar';

const SUBJECTS: Record<EmailTemplate, Record<Locale, string>> = {
  deal_confirmed: {
    fr: 'Votre transaction Mawsim est confirmée',
    ar: 'تم تأكيد معاملتك على موسم',
  },
  payment_received: {
    fr: 'Paiement reçu — Mawsim',
    ar: 'تم استلام الدفعة — موسم',
  },
  delivery_reminder: {
    fr: 'Rappel de livraison — Mawsim',
    ar: 'تذكير بالتسليم — موسم',
  },
  offer_received: {
    fr: 'Nouvelle offre reçue — Mawsim',
    ar: 'عرض جديد على موسم',
  },
  price_alert: {
    fr: 'Alerte prix déclenchée — Mawsim',
    ar: 'تم تفعيل تنبيه السعر — موسم',
  },
};

function renderHtml(
  template: EmailTemplate,
  data: Record<string, unknown>,
  locale: Locale
): string {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const brand = `<td style="background:#C8873A;padding:16px 24px;">
    <span style="font-size:22px;font-weight:700;color:#fff;">Mawsim — موسم</span>
  </td>`;

  const bodies: Record<EmailTemplate, Record<Locale, string>> = {
    offer_received: {
      fr: `<p>Vous avez reçu une nouvelle offre sur votre annonce.</p>
           <p><strong>Produit :</strong> ${data['product'] ?? '—'}</p>
           <p><strong>Prix proposé :</strong> ${data['price'] ?? '—'} MAD/qtx</p>
           <p><strong>Quantité :</strong> ${data['quantity'] ?? '—'} qtx</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Voir l'offre</a></p>`,
      ar: `<p>لقد تلقيت عرضاً جديداً على إعلانك.</p>
           <p><strong>المنتج:</strong> ${data['product'] ?? '—'}</p>
           <p><strong>السعر المقترح:</strong> ${data['price'] ?? '—'} درهم/قنطار</p>
           <p><strong>الكمية:</strong> ${data['quantity'] ?? '—'} قنطار</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">عرض الصفقة</a></p>`,
    },
    deal_confirmed: {
      fr: `<p>Votre transaction a été confirmée par les deux parties.</p>
           <p><strong>Produit :</strong> ${data['product'] ?? '—'}</p>
           <p><strong>Montant total :</strong> ${data['total'] ?? '—'} MAD</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Voir la transaction</a></p>`,
      ar: `<p>تم تأكيد معاملتك من قِبل الطرفين.</p>
           <p><strong>المنتج:</strong> ${data['product'] ?? '—'}</p>
           <p><strong>المبلغ الإجمالي:</strong> ${data['total'] ?? '—'} درهم</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">عرض المعاملة</a></p>`,
    },
    payment_received: {
      fr: `<p>Votre acompte de <strong>${data['amount'] ?? '—'} MAD</strong> a bien été reçu.</p>
           <p>Le solde de 70% sera libéré à la confirmation de livraison.</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#3D5A3E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Voir la transaction</a></p>`,
      ar: `<p>تم استلام دفعتك المقدمة البالغة <strong>${data['amount'] ?? '—'} درهم</strong>.</p>
           <p>سيتم إطلاق الرصيد المتبقي (70%) عند تأكيد التسليم.</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#3D5A3E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">عرض المعاملة</a></p>`,
    },
    delivery_reminder: {
      fr: `<p>Rappel : la livraison de votre commande est prévue le <strong>${data['date'] ?? '—'}</strong>.</p>
           <p>Pensez à confirmer la réception une fois les marchandises livrées.</p>`,
      ar: `<p>تذكير: من المقرر تسليم طلبك في <strong>${data['date'] ?? '—'}</strong>.</p>
           <p>يرجى تأكيد الاستلام بعد وصول البضاعة.</p>`,
    },
    price_alert: {
      fr: `<p>Votre alerte prix a été déclenchée.</p>
           <p><strong>Produit :</strong> ${data['product'] ?? '—'} — ${data['region'] ?? '—'}</p>
           <p><strong>Prix actuel :</strong> ${data['current'] ?? '—'} MAD/qtx</p>
           <p><strong>Votre seuil :</strong> ${data['threshold'] ?? '—'} MAD/qtx</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Voir le tableau des prix</a></p>`,
      ar: `<p>تم تفعيل تنبيه السعر الخاص بك.</p>
           <p><strong>المنتج:</strong> ${data['product'] ?? '—'} — ${data['region'] ?? '—'}</p>
           <p><strong>السعر الحالي:</strong> ${data['current'] ?? '—'} درهم/قنطار</p>
           <p><strong>حدك:</strong> ${data['threshold'] ?? '—'} درهم/قنطار</p>
           <p><a href="${data['url'] ?? '#'}" style="background:#C8873A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">عرض لوحة الأسعار</a></p>`,
    },
  };

  const body = bodies[template][locale];

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1);">
    <tr>${brand}</tr>
    <tr><td style="padding:24px;color:#1A1A1A;font-size:15px;line-height:1.6;direction:${dir};">${body}</td></tr>
    <tr><td style="padding:16px 24px;background:#F5F0E8;font-size:12px;color:#888;text-align:center;">
      Mawsim — مawsim.ma — De la terre à l'usine, sans intermédiaires inutiles.
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(params: {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  locale?: Locale;
}): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    // Skip gracefully in dev/test — log so it's visible but never throw.
    console.info('[sendEmail] RESEND_API_KEY not set — skipping', params.template, params.to);
    return;
  }

  const locale = params.locale ?? 'fr';
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: 'Mawsim <noreply@mawsim.ma>',
    to: params.to,
    subject: SUBJECTS[params.template][locale],
    html: renderHtml(params.template, params.data, locale),
  });
}
