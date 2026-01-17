'use client'
import { Fragment, useContext, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { useMediaQuery } from 'react-responsive';
import {
	ListGroup,
	Card,
	Image,
	Badge,
} from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';
import AccordionContext from 'react-bootstrap/AccordionContext';
import { useAccordionButton } from 'react-bootstrap/AccordionButton';

// import simple bar scrolling used for notification item scrolling
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';

import { DashboardMenu } from '@/routes/DashboardRoutes';
import { useAuth } from '@/hooks/useAuth';

type IProps = {
	showMenu: boolean;
	onClick: (value: boolean) => void
}

type IToggleProps = {
	children?: any;
	eventKey?: number;
	icon?: string;
}

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

const NavbarVertical = (props: IProps) => {
	const location = usePathname()
	const { user, isLoading } = useAuth();
	
	// Debug logging
	if (typeof window !== 'undefined') {
		console.log('NavbarVertical RENDER - isLoading:', isLoading, 'user:', user);
	}
	
	// Check if user has required role for a menu item - memoized with useCallback
	const hasRequiredRole = useCallback((requiredRoles?: string[]): boolean => {
		console.log('hasRequiredRole called with:', requiredRoles, 'user:', user, 'isLoading:', isLoading);
		
		// If still loading, don't render restricted items
		if (isLoading) {
			console.log('Still loading, returning:', !requiredRoles || requiredRoles.length === 0);
			return !requiredRoles || requiredRoles.length === 0;
		}

		// Eğer role requirement yoksa (undefined veya boş array), tüm kullanıcılar görebilir
		if (!requiredRoles || requiredRoles.length === 0) {
			console.log('No role requirement, allowing access');
			return true; // No role restriction - everyone can see
		}
		
		// Role requirement var
		if (!user) {
			console.log('⛔ No user, denying access to:', requiredRoles);
			return false;
		}

		// Kritik: roles yoksa veya boş array ise, EMPLOYEE gibi davran = erişim yok
		if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
			console.log('⛔ User has EMPTY ROLES [], denying access to required:', requiredRoles);
			return false;
		}

		// Roles varsa, gerekli role'ün içinde olup olmadığını kontrol et
		const hasRole = requiredRoles.some(requiredRole => 
			user.roles?.includes(requiredRole)
		);
		console.log('✅ User has roles:', user.roles, 'Required:', requiredRoles, 'Allowed:', hasRole);
		return hasRole;
	}, [user, isLoading]);
	
	// Mevcut URL'ye göre hangi accordion'ın açık olması gerektiğini belirle
	const getActiveAccordionKeys = useMemo(() => {
		const activeKeys: string[] = [];
		
		const findActiveMenu = (menuItems: any[], parentIndex?: number) => {
			menuItems.forEach((menu, index) => {
				const currentKey = index.toString();
				
				if (menu.children) {
					// Alt menülerde mevcut URL'yi ara
					const hasActiveChild = menu.children.some((child: any) => {
						if (child.children) {
							return child.children.some((grandChild: any) => location === grandChild.link);
						}
						return location === child.link;
					});
					
					if (hasActiveChild) {
						activeKeys.push(currentKey);
						findActiveMenu(menu.children, index);
					}
				}
			});
		};
		
		findActiveMenu(DashboardMenu);
		return activeKeys;
	}, [location]);

	const CustomToggle = ({ children, eventKey, icon }: IToggleProps) => {
		const { activeEventKey } = useContext(AccordionContext);
		const decoratedOnClick = useAccordionButton(eventKey?.toString() as any);
		const isCurrentEventKey = activeEventKey === eventKey?.toString();
		
		return (
			<li className="nav-item">
				<Link
					href="#"
					className="nav-link "
					onClick={decoratedOnClick}
					data-bs-toggle="collapse"
					data-bs-target="#navDashboard"
					aria-expanded={isCurrentEventKey ? true : false}
					aria-controls="navDashboard">
					{icon ? <i className={`nav-icon fe fe-${icon} me-2`}></i> : ''}{' '}
					{children}
				</Link>
			</li>
		);
	};
	const CustomToggleLevel2 = ({ children, eventKey, icon }: IToggleProps) => {
		const { activeEventKey } = useContext(AccordionContext);
		const decoratedOnClick = useAccordionButton(eventKey?.toString() as any, () =>
			console.log('totally custom!')
		);
		const isCurrentEventKey = activeEventKey === eventKey;
		return (
			(<Link
				href="#"
				className="nav-link "
				onClick={decoratedOnClick}
				data-bs-toggle="collapse"
				data-bs-target="#navDashboard"
				aria-expanded={isCurrentEventKey ? true : false}
				aria-controls="navDashboard">
				{children}
			</Link>)
		);
	};

	const generateLink = (item: IMenuProps) => {
		return (
			(<a
				href={item.link}
				className={`nav-link ${location === item.link ? 'active' : ''
					}`}
				onClick={(e) =>
					isMobile ? props.onClick(!props.showMenu) : props.showMenu
				}>

				{item.name}
				{''}
				{item.badge ? (
					<Badge
						className="ms-1"
						bg={item.badgecolor ? item.badgecolor : 'primary'}
					>
						{item.badge}
					</Badge>
				) : (
					''
				)}

			</a>)
		);
	};

	const isMobile = useMediaQuery({ maxWidth: 767 });

	return (
		<Fragment>
			<SimpleBar style={{ maxHeight: '100vh' }}>
				<div className="nav-scroller">
					<Link href="/" className="navbar-brand text-white fw-bold">
						Kartezya HR
					</Link>
				</div>
				{/* Dashboard Menu */}
				<Accordion 
					defaultActiveKey={getActiveAccordionKeys}
					as="ul" 
					className="navbar-nav flex-column"
				>
					{DashboardMenu.map(function (menu, index) {
						// Check role access for this menu item
						if (!hasRequiredRole(menu.requiredRoles)) {
							return null;
						}

						if (menu.grouptitle) {
							return (
								<Card bsPrefix="nav-item" key={index}>
									{/* group title item */}
									<div className="navbar-heading">{menu.title}</div>
									{/* end of group title item */}
								</Card>
							);
						} else {
							if (menu.children) {
								// Filter children based on role
								const visibleChildren = menu.children.filter(child => 
									hasRequiredRole(child.requiredRoles)
								);

								// Don't render if no visible children
								if (visibleChildren.length === 0) {
									return null;
								}

								return (
									<Fragment key={index}>
										{/* main menu / root menu level / root items */}
										<CustomToggle eventKey={index} icon={menu.icon}>
											{menu.title}
											{menu.badge ? (
												<Badge className="ms-1" bg={menu.badgecolor ? menu.badgecolor : 'primary'}>
													{menu.badge}
												</Badge>
											) : ('')}
										</CustomToggle>
										<Accordion.Collapse eventKey={index.toString()} as="li" bsPrefix="nav-item">
											<ListGroup as="ul" bsPrefix="" className="nav flex-column">
												{visibleChildren.map(function (menuLevel1Item, menuLevel1Index) {
													if (menuLevel1Item.children) {
														return (
															<ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel1Index}>
																{/* first level menu started  */}
																<Accordion
																	defaultActiveKey={getActiveAccordionKeys.includes(`${index}-${menuLevel1Index}`) ? ["0"] : []}
																	activeKey={getActiveAccordionKeys.includes(`${index}-${menuLevel1Index}`) ? ["0"] : []}
																	className="navbar-nav flex-column"
																>
																	<CustomToggleLevel2 eventKey={0}>
																		{menuLevel1Item.title}
																		{menuLevel1Item.badge ? (
																			<Badge className="ms-1" bg={
																				menuLevel1Item.badgecolor ? menuLevel1Item.badgecolor : 'primary'
																			}>
																				{menuLevel1Item.badge}
																			</Badge>
																		) : ('')}
																	</CustomToggleLevel2>
																	<Accordion.Collapse eventKey={"0"} bsPrefix="nav-item">
																		<ListGroup as="ul" bsPrefix="" className="nav flex-column">
																			{/* second level menu started  */}
																			{menuLevel1Item.children.map(function (menuLevel2Item, menuLevel2Index) {
																				if (menuLevel2Item.children) {
																					return (
																						<ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel2Index}>
																							{/* second level accordion menu started  */}
																							<Accordion defaultActiveKey="0" className="navbar-nav flex-column">
																								<CustomToggleLevel2 eventKey={0}>
																									{menuLevel2Item.title}
																									{menuLevel2Item.badge ? (
																										<Badge className="ms-1" bg={
																											menuLevel2Item.badgecolor ? menuLevel2Item.badgecolor : 'primary'
																										}>
																											{menuLevel2Item.badge}
																										</Badge>
																									) : ('')}
																								</CustomToggleLevel2>
																								<Accordion.Collapse eventKey={"0"} bsPrefix="nav-item">
																									<ListGroup as="ul" bsPrefix="" className="nav flex-column">
																										{/* third level menu started  */}
																										{menuLevel2Item.children.map(function (menuLevel3Item, menuLevel3Index) {
																											return (
																												<ListGroup.Item key={menuLevel3Index} as="li" bsPrefix="nav-item">
																													{generateLink(menuLevel3Item)}
																												</ListGroup.Item>
																											);
																										})}
																										{/* end of third level menu  */}
																									</ListGroup>
																								</Accordion.Collapse>
																							</Accordion>
																							{/* end of second level accordion */}
																						</ListGroup.Item>
																					);
																				} else {
																					return (
																						<ListGroup.Item key={menuLevel2Index} as="li" bsPrefix="nav-item">
																							{generateLink(menuLevel2Item)}
																						</ListGroup.Item>
																					);
																				}

																			})}
																			{/* end of second level menu  */}
																		</ListGroup>
																	</Accordion.Collapse>
																</Accordion>
																{/* end of first level menu */}
															</ListGroup.Item>
														);
													} else {
														return (
															<ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel1Index}>
																{/* first level menu items */}
																{generateLink(menuLevel1Item)}
																{/* end of first level menu items */}
															</ListGroup.Item>
														);
													}
												})}
											</ListGroup>
										</Accordion.Collapse>
										{/* end of main menu / menu level 1 / root items */}
									</Fragment>
								);
							} else {
								return (
									<Card bsPrefix="nav-item" key={index}>
										{/* menu item without any childern items like Documentation and Changelog items*/}
										<a href={menu.link} className={`nav-link ${location === menu.link ? 'active' : ''}`}>
											{typeof menu.icon === 'string' ? (
												<i className={`nav-icon fe fe-${menu.icon} me-2`}></i>
											) : (menu.icon)}
											{menu.title}
											{menu.badge ? (
												<Badge className="ms-1" bg={menu.badgecolor ? menu.badgecolor : 'primary'}>
													{menu.badge}
												</Badge>
											) : ('')}
										</a>
										{/* end of menu item without any childern items */}
									</Card>
								);
							}
						}
					})}
				</Accordion>
				{/* end of Dashboard Menu */}

			</SimpleBar>
		</Fragment>
	);
};

export default NavbarVertical;
