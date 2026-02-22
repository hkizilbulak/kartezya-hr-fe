'use client';

import 'styles/theme.scss';
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import DashboardWrapper from './dashboard-wrapper';
import Loading from '@/components/Loading';

// ADMIN gereken sayfalar
const ADMIN_REQUIRED_ROUTES = [
  '/employees',
  '/companies',
  '/departments',
  '/job-positions',
  '/leave-management/types',
  '/leave-management/requests',
  '/reports/work-day',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Show loading while checking authentication
  if (isLoading) {
    return <Loading />;
  }

  // If no user, don't render anything (redirect is happening in useAuth hook)
  if (!user) {
    return null;
  }

  // ADMIN gereken rotalar için kontrol
  const requiresAdmin = ADMIN_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
  
  if (requiresAdmin && !user.roles.includes('ADMIN')) {
    // ADMIN değilse dashboard'a yönlendir
    router.replace('/');
    return null;
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}
