import { getMyFarmerProfile, listMyCertifications } from '@/server/farmer-profile';
import { FarmerProfileForm } from './farmer-profile-form';

// User-specific (reads session) — never prerender.
export const dynamic = 'force-dynamic';

export default async function FarmerProfilePage() {
  const [profileRes, certsRes] = await Promise.all([getMyFarmerProfile(), listMyCertifications()]);

  const profile = profileRes.success ? profileRes.data : null;
  const certifications = certsRes.success ? certsRes.data : [];

  return <FarmerProfileForm profile={profile} certifications={certifications} />;
}
