import { projects, users } from '@/lib/data';
import { DashboardPage } from '@/components/dashboard-page';

export default function Dashboard() {
  return <DashboardPage projects={projects} users={users} />;
}
