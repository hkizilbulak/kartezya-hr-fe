import { UserRole } from '@/models/enums/hr.enum';

/** Capability values must match backend authz.Capability string constants exactly. */
export const Capability = {
  CanViewEmployees: 'canViewEmployees',
  CanManageEmployees: 'canManageEmployees',
  CanManageOrgMaster: 'canManageOrgMaster',
  CanManageLeaveTypes: 'canManageLeaveTypes',
  CanViewLeaveManagement: 'canViewLeaveManagement',
  CanApproveLeave: 'canApproveLeave',
  CanViewExpenseManagement: 'canViewExpenseManagement',
  CanApproveExpense: 'canApproveExpense',
  CanPayExpense: 'canPayExpense',
  CanManageExpenseTypes: 'canManageExpenseTypes',
  CanManageOtherRequests: 'canManageOtherRequests',
  CanManageRequestTypes: 'canManageRequestTypes',
  CanAccessAdminModules: 'canAccessAdminModules',
} as const;

export type Capability = (typeof Capability)[keyof typeof Capability];

const ALL_CAPABILITIES: Capability[] = Object.values(Capability);

/** Role → capability mapping; must stay aligned with backend RoleCapabilities. */
export const RoleCapabilities: Record<UserRole, readonly Capability[]> = {
  [UserRole.ADMIN]: ALL_CAPABILITIES,
  [UserRole.HR]: ALL_CAPABILITIES.filter((c) => c !== Capability.CanPayExpense),
  [UserRole.FINANCE]: [
    Capability.CanViewEmployees,
    Capability.CanViewExpenseManagement,
    Capability.CanPayExpense,
    Capability.CanManageExpenseTypes,
  ],
  [UserRole.EMPLOYEE]: [],
};

export function hasCapability(
  roles: string[] | undefined | null,
  capability: Capability
): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  for (const role of roles) {
    const caps = RoleCapabilities[role as UserRole];
    if (caps?.includes(capability)) {
      return true;
    }
  }
  return false;
}
