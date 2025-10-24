
import { redirect } from 'next/navigation';

export default function WhatsNewPage() {
  // Redirect to the main dashboard as the content is now in a dialog
  redirect('/my-dashboard');
}
