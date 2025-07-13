import DashboardWrapper from '@/components/dashboard-wrapper';

// This page now acts as a pure Server Component.
// It renders the DashboardWrapper, which is a Client Component.
// The wrapper then dynamically imports the actual DashboardPage with SSR turned off.
export default function Dashboard() {
  return <DashboardWrapper />;
}
