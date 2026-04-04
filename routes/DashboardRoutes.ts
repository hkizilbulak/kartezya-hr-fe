interface IMenuProps {
	id: string;
	title?: string;
	name?: string;
	icon?: string;
	link?: string;
	grouptitle?: boolean;
	children?: IMenuProps[];
	badge?: string;
	badgecolor?: string;
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
			}
		]
	},
	{
		id: 'employees',
		title: 'Çalışanlar',
		icon: 'user',
		link: '/employees',
		requiredRoles: ['ADMIN']
	},
	{
		id: 'request-management',
		title: 'Talep Yönetimi',
		icon: 'clipboard',
		requiredRoles: ['ADMIN'],
		children: [
			{
				id: 'leave-requests',
				link: '/leave-management/requests',
				name: 'İzin Talepleri',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'expense-requests',
				link: '/expense-management/requests',
				name: 'Masraf Talepleri',
				requiredRoles: ['ADMIN']
			}
		]
	},
	{
		id: 'definitions',
		title: 'Tanımlamalar',
		icon: 'settings',
		requiredRoles: ['ADMIN'],
		children: [
			{
				id: 'companies',
				name: 'Şirketler',
				link: '/companies',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'departments',
				name: 'Departmanlar',
				link: '/departments',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'job-positions',
				name: 'Pozisyonlar',
				link: '/job-positions',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'leave-types',
				name: 'İzin Türleri',
				link: '/leave-management/types',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'expense-types',
				name: 'Masraf Türleri',
				link: '/expense-management/types',
				requiredRoles: ['ADMIN']
			}
		]
	},
	{
		id: 'reports',
		title: 'Raporlar',
		icon: 'bar-chart-2',
		requiredRoles: ['ADMIN'],
		children: [
			{
				id: 'work-day-report',
				link: '/reports/work-day',
				name: 'Çalışma Günü Raporu',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'grade',
				link: '/reports/grade',
				name: 'Grade Raporu',
				requiredRoles: ['ADMIN']
			}
		]
	},
	{
		id: 'cv-management',
		title: 'CV Yönetimi',
		icon: 'file',
		requiredRoles: ['ADMIN'],
		children: [
			{
				id: 'cv-upload',
				name: 'CV Yükleme',
				link: '/cv-upload',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'cv-search',
				name: 'CV Arama',
				link: '/cv-search',
				requiredRoles: ['ADMIN']
			},
			{
				id: 'candidates',
				name: 'Adaylar',
				link: '/candidates',
				requiredRoles: ['ADMIN']
			}
		]
	},
];

export default DashboardMenu;
