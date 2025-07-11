
import { redirect } from 'next/navigation';

// This page just redirects to the main dashboard.
// We keep it in case of old bookmarks, but the primary link is now 'Tim Kerja'.
export default function ProjectsPage() {
  redirect('/dashboard');
}
