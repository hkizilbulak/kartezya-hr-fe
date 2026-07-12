'use client';

import '@/styles/theme.scss';
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import DashboardWrapper from './dashboard-wrapper';
import Loading from '@/components/Loading';
import MissingInfoModal from '@/components/modals/MissingInfoModal';
import KvkkModal from '@/components/modals/KvkkModal';
import { Capability, hasCapability } from '@/lib/authz/capabilities';
import { UserRole } from '@/models/enums/hr.enum';

type RouteGuard =
  | { prefix: string; capability: Capability }
  | { prefix: string; adminOnly: true };

/** More specific prefixes first where paths share a parent. */
const ROUTE_GUARDS: RouteGuard[] = [
  { prefix: '/employees', capability: Capability.CanViewEmployees },
  { prefix: '/companies', capability: Capability.CanManageOrgMaster },
  { prefix: '/departments', capability: Capability.CanManageOrgMaster },
  { prefix: '/job-positions', capability: Capability.CanManageOrgMaster },
  { prefix: '/leave-management/types', capability: Capability.CanManageLeaveTypes },
  { prefix: '/leave-management/requests', capability: Capability.CanViewLeaveManagement },
  { prefix: '/expense-management/types', capability: Capability.CanManageExpenseTypes },
  { prefix: '/expense-management/requests', capability: Capability.CanViewExpenseManagement },
  { prefix: '/other-requests-management/types', capability: Capability.CanManageRequestTypes },
  { prefix: '/other-requests-management', capability: Capability.CanManageOtherRequests },
  { prefix: '/contracts', adminOnly: true },
  { prefix: '/send-mail', adminOnly: true },
  { prefix: '/mail-config', adminOnly: true },
  { prefix: '/reports', adminOnly: true },
  { prefix: '/job-management', adminOnly: true },
  { prefix: '/cv-upload', adminOnly: true },
  { prefix: '/cv-search', adminOnly: true },
  { prefix: '/candidates', adminOnly: true },
  { prefix: '/kspeaker', adminOnly: true },
  { prefix: '/events', adminOnly: true },
  { prefix: '/faqs', adminOnly: true },
];

function isRouteAllowed(pathname: string, roles: string[]): boolean {
  const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.prefix));
  if (!guard) {
    return true;
  }
  if ('adminOnly' in guard) {
    return roles.includes(UserRole.ADMIN);
  }
  return hasCapability(roles, guard.capability);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (!isRouteAllowed(pathname, user.roles ?? [])) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <MissingInfoModal />
      <KvkkModal />
      <DashboardWrapper>{children}</DashboardWrapper>
    </>
  );
}
