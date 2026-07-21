// import node module libraries
import { Menu } from 'react-feather';
import {
	Nav,
	Navbar,
	Form
} from 'react-bootstrap';

// import sub components
import QuickMenu from '@/layouts/QuickMenu';

type IProps = {
	showMenu: boolean;
	onToggleSidebarMenu: (value: boolean) => void
}

const NavbarTop = (props: IProps) => {
	return (
		<Navbar expand="lg" className="navbar-classic navbar navbar-expand-lg">
			<div className='d-flex justify-content-between w-100'>
				<div className="d-flex align-items-center">
					<button
						type="button"
						id="nav-toggle"
						className="nav-icon me-2 icon-xs border-0 bg-transparent p-0"
						onClick={() => props.onToggleSidebarMenu(!props.showMenu)}>
						<Menu size="18px" />
					</button>
				</div>
				{/* Quick Menu */}
				<Nav className="navbar-right-wrap ms-2 d-flex nav-top-wrap">
					<QuickMenu />
				</Nav>
			</div>
		</Navbar>
	);
};

export default NavbarTop;
