import { redirect } from 'next/navigation';

// The dashboard already serves as the main project list.
// This page just redirects there to make the sidebar link work.
export default function ProjectsPage() {
  redirect('/dashboard');
}
