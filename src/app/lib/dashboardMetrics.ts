import { Revenue, Project, User } from '@/lib/types';

export interface DashboardKPIs {
  totalRevenue: number;
  pendingPayments: number;
  activeProjects: number;
  contributors: number;
  monthOverMonthChange: number;
}

export function calculateDashboardKPIs(params: {
  revenue: Revenue[];
  projects: Project[];
  users: User[];
}): DashboardKPIs {
  const { revenue, projects, users } = params;
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const pendingPayments = revenue
    .filter((r) => r.status === 'Pending' || r.status === 'Processing')
    .reduce((sum, r) => sum + r.amount, 0);
  const activeProjects = projects.filter((p) => p.status === 'Active' || p.status === 'In Progress').length;
  const contributors = users.filter((u) => u.role === 'contributor').length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTotal = revenue
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const previousMonthTotal = revenue
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  let monthOverMonthChange = 0;
  if (previousMonthTotal === 0) {
    monthOverMonthChange = currentMonthTotal > 0 ? 100 : 0;
  } else {
    monthOverMonthChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
  }

  return {
    totalRevenue,
    pendingPayments,
    activeProjects,
    contributors,
    monthOverMonthChange,
  };
}
