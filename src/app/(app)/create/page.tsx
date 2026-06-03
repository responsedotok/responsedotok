import { CreatePresskitForm } from '@/components/create-presskit-form';
import { getCurrentUser } from '@/lib/auth/users/get-current-user';

export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  const user = await getCurrentUser();

  return <CreatePresskitForm defaultArtist={user?.display_name ?? ''} />;
}
