import { ListingForm } from '../listing-form';

// Reads session via the action it calls — never prerender.
export const dynamic = 'force-dynamic';

export default function NewListingPage() {
  return <ListingForm />;
}
