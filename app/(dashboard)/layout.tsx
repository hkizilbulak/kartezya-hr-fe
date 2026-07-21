'use client';

import { useEffect, useRef } from 'react';
import '@/styles/theme.scss';
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import DashboardWrapper from './dashboard-wrapper';
import Loading from '@/components/Loading';
import MissingInfoModal from '@/components/modals/MissingInfoModal';
import KvkkModal from '@/components/modals/KvkkModal';
import { Capability, hasCapability } from '@/lib/authz/capabilities';

type RouteGuard = { prefix: string; capability: Capability };

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
  { prefix: '/contracts', capability: Capability.CanAccessAdminModules },
  { prefix: '/send-mail', capability: Capability.CanAccessAdminModules },
  { prefix: '/mail-config', capability: Capability.CanAccessAdminModules },
  { prefix: '/reports', capability: Capability.CanAccessAdminModules },
  { prefix: '/job-management', capability: Capability.CanAccessAdminModules },
  { prefix: '/cv-upload', capability: Capability.CanAccessAdminModules },
  { prefix: '/cv-search', capability: Capability.CanAccessAdminModules },
  { prefix: '/candidates', capability: Capability.CanAccessAdminModules },
  { prefix: '/kspeaker', capability: Capability.CanAccessAdminModules },
  { prefix: '/events', capability: Capability.CanAccessAdminModules },
  { prefix: '/faqs', capability: Capability.CanAccessAdminModules },
];

function isRouteAllowed(pathname: string, roles: string[]): boolean {
  const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.prefix));
  if (!guard) {
    return true;
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

  const redirectKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Auth hydration tamamlanmadan redirect etme.
    if (!user) {
      const key = `login:${pathname}`;
      if (redirectKeyRef.current !== key && pathname !== '/login') {
        redirectKeyRef.current = key;
        router.replace('/login');
      }
      return;
    }

    // Yetki reddi: render içinde değil, effect içinde redirect.
    if (!isRouteAllowed(pathname, user.roles ?? [])) {
      const key = `denied:${pathname}`;
      if (redirectKeyRef.current !== key && pathname !== '/') {
        redirectKeyRef.current = key;
        router.replace('/');
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Loading />;
  }

  if (!isRouteAllowed(pathname, user.roles ?? [])) {
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
