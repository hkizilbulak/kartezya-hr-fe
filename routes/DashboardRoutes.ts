import { Capability } from '@/lib/authz/capabilities';

export interface IMenuProps {
    id: string;
    title?: string;
    name?: string;
    icon?: string;
    link?: string;
    grouptitle?: boolean;
    children?: IMenuProps[];
    badge?: string;
    badgecolor?: string;
    /** Capability required to see this item (preferred for ticket-scoped modules). */
    requiredCapability?: Capability;
    /** Role gate for unresolved ADMIN-only modules outside the capability model. */
    requiredRoles?: string[];
}

export const DashboardMenu: IMenuProps[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'home',
        link: '/'
    },
    {
        id: 'my-profile',
        title: 'Personel Bilgilerim',
        icon: 'user',
        link: '/my-profile'
    },
    {
        id: 'my-requests',
        title: 'Taleplerim',
        icon: 'file-text',
        children: [
            {
                id: 'my-leave-requests',
                link: '/my-requests/leave',
                name: 'İzin Taleplerim'
            },
            {
                id: 'my-expense-requests',
                link: '/my-requests/expense',
                name: 'Masraf Taleplerim'
            },
            {
                id: 'other-requests',
                link: '/my-requests/other',
                name: 'Diğer Taleplerim'
            }
        ]
    },
    {
        id: 'employee-management',
        title: 'Çalışan Yönetimi',
        icon: 'users',
        children: [
            {
                id: 'employees',
                name: 'Çalışanlar',
                link: '/employees',
                requiredCapability: Capability.CanViewEmployees
            },
            {
                id: 'contracts',
                name: 'Kurumsal Sözleşmeler',
                link: '/contracts',
                requiredCapability: Capability.CanAccessAdminModules
            }
        ]
    },
    {
        id: 'notification-management',
        title: 'Bildirim Yönetimi',
        icon: 'mail',
        requiredCapability: Capability.CanAccessAdminModules,
        children: [
            {
                id: 'send-mail',
                name: 'Dinamik Mail Gönder',
                link: '/send-mail',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'mail-config',
                name: 'Mail Konfigürasyonları',
                link: '/mail-config',
                requiredCapability: Capability.CanAccessAdminModules
            }
        ]
    },
    {
        id: 'request-management',
        title: 'Talep Yönetimi',
        icon: 'clipboard',
        children: [
            {
                id: 'leave-requests',
                link: '/leave-management/requests',
                name: 'İzin Talepleri',
                requiredCapability: Capability.CanViewLeaveManagement
            },
            {
                id: 'expense-requests',
                link: '/expense-management/requests',
                name: 'Masraf Talepleri',
                requiredCapability: Capability.CanViewExpenseManagement
            },
            {
                id: 'other-requests-management',
                link: '/other-requests-management/requests',
                name: 'Diğer Talepler',
                requiredCapability: Capability.CanManageOtherRequests
            }
        ]
    },
    {
        id: 'definitions',
        title: 'Tanımlamalar',
        icon: 'settings',
        children: [
            {
                id: 'companies',
                name: 'Şirketler',
                link: '/companies',
                requiredCapability: Capability.CanManageOrgMaster
            },
            {
                id: 'departments',
                name: 'Departmanlar',
                link: '/departments',
                requiredCapability: Capability.CanManageOrgMaster
            },
            {
                id: 'job-positions',
                name: 'Pozisyonlar',
                link: '/job-positions',
                requiredCapability: Capability.CanManageOrgMaster
            },
            {
                id: 'leave-types',
                name: 'İzin Türleri',
                link: '/leave-management/types',
                requiredCapability: Capability.CanManageLeaveTypes
            },
            {
                id: 'expense-types',
                name: 'Masraf Türleri',
                link: '/expense-management/types',
                requiredCapability: Capability.CanManageExpenseTypes
            },
            {
                id: 'request-types',
                name: 'Talep Türleri',
                link: '/other-requests-management/types',
                requiredCapability: Capability.CanManageRequestTypes
            },
            {
                id: 'kspeaker-vouchers',
                name: 'Kspeaker Voucher',
                link: '/kspeaker/vouchers',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'events',
                name: 'Etkinlikler',
                link: '/events',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'faqs',
                name: 'Sıkça Sorulan Sorular',
                link: '/faqs',
                requiredCapability: Capability.CanAccessAdminModules
            }
        ]
    },
    {
        id: 'reports',
        title: 'Raporlar',
        icon: 'bar-chart-2',
        requiredCapability: Capability.CanAccessAdminModules,
        children: [
            {
                id: 'work-day-report',
                link: '/reports/work-day',
                name: 'Çalışma Günü Raporu',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'hakedis-efor-report',
                link: '/reports/hakedis-efor',
                name: 'Hakediş Efor Raporu',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'grade',
                link: '/reports/grade',
                name: 'Grade Raporu',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'contract-report',
                link: '/reports/contract',
                name: 'Sözleşme Raporu',
                requiredCapability: Capability.CanAccessAdminModules
            }
        ]
    },
    {
        id: 'job-management',
        title: 'Zamanlanmış Görevler',
        icon: 'clock',
        link: '/job-management',
        requiredCapability: Capability.CanAccessAdminModules
    },
    {
        id: 'cv-management',
        title: 'CV Yönetimi',
        icon: 'file',
        requiredCapability: Capability.CanAccessAdminModules,
        children: [
            {
                id: 'cv-upload',
                name: 'CV Yükleme',
                link: '/cv-upload',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'cv-search',
                name: 'CV Arama',
                link: '/cv-search',
                requiredCapability: Capability.CanAccessAdminModules
            },
            {
                id: 'candidates',
                name: 'Adaylar',
                link: '/candidates',
                requiredCapability: Capability.CanAccessAdminModules
            }
        ]
    },
    {
        id: 'employee-faqs',
        title: 'Sıkça Sorulan Sorular',
        icon: 'help-circle', 
        link: '/employee-faqs'
    }
];

export default DashboardMenu;
