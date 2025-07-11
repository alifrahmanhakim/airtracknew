import { redirect } from 'next/navigation';

export default function Home() {
  // For now, we'll assume the user is not logged in and redirect to login.
  // Later, we can add logic to check for an active session.
  redirect('/login');
}
