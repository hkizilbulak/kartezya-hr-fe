'use client';

import '@/styles/theme.scss';
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import DashboardWrapper from './dashboard-wrapper';
import Loading from '@/components/Loading';
import MissingInfoModal from '@/components/modals/MissingInfoModal';
import KvkkModal from '@/components/modals/KvkkModal';

const ADMIN_REQUIRED_ROUTES = [
  '/employees',
  '/companies',
  '/departments',
  '/job-positions',
  '/leave-management/types',
  '/leave-management/requests',
  '/reports/work-day',
  '/cv-upload',
  '/cv-search',
  '/other-requests-management',
  '/request-types',
];

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

  const requiresAdmin = ADMIN_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
  const isHrRoute = pathname.startsWith('/other-requests-management') || pathname.startsWith('/request-types');

  if (requiresAdmin) {
    if (isHrRoute) {
      if (!user.roles.includes('ADMIN') && !user.roles.includes('HR')) {
        router.replace('/');
        return null;
      }
    } else {
      if (!user.roles.includes('ADMIN')) {
        router.replace('/');
        return null;
      }
    }
  }

  return (
    <>
      <MissingInfoModal />
      <KvkkModal />
      <DashboardWrapper>{children}</DashboardWrapper>
    </>
  );
}