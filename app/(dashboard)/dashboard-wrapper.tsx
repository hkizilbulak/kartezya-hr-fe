'use client';
import { useState } from 'react';
import NavbarVertical from '@/layouts/navbars/NavbarVertical';
import NavbarTop from '@/layouts/navbars/NavbarTop';

export default function DashboardWrapper({
	children,
}: {
	children: React.ReactNode
}) {
	const [showMenu, setShowMenu] = useState(true);

	return (
		<div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
			<div className="navbar-vertical navbar">
				<NavbarVertical
					showMenu={showMenu}
					onClick={(value: boolean) => setShowMenu(value)}
				/>
			</div>
			<div 
				id="page-content" 
				onClick={(e) => {
					// Ignore clicks on interactive elements
					const target = e.target as HTMLElement;
					const isInteractive = target.closest('button, a, input, select, textarea, label, .btn, .dropdown-toggle, .nav-link, .form-control, .form-select, [role="button"], [role="combobox"]');
					if (isInteractive) {
						return;
					}

					if (typeof window !== 'undefined') {
						const isMobile = window.innerWidth <= 768;
						if (isMobile) {
							// On mobile, showMenu=false means it's OPEN (toggled class adds margin-left: 0)
							if (!showMenu) {
								setShowMenu(true);
							}
						} else {
							// On PC, showMenu=true means it's OPEN (no toggled class)
							if (showMenu) {
								setShowMenu(false);
							}
						}
					}
				}}
			>
				<div className="header">
					<NavbarTop
						showMenu={showMenu}
						onToggleSidebarMenu={(value: boolean) => setShowMenu(value)}
					/>
				</div>
				{children}
			</div>
		</div>
	);
}