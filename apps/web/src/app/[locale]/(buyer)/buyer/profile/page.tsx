import { getMyBuyerProfile } from '@/server/buyer-profile';
import { BuyerProfileForm } from './buyer-profile-form';

// User-specific (reads session) — never prerender.
export const dynamic = 'force-dynamic';

export default async function BuyerProfilePage() {
  const res = await getMyBuyerProfile();
  const profile = res.success ? res.data : null;
  return <BuyerProfileForm profile={profile} />;
}
