import { Fragment, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import {
    Image,
    Dropdown,
    ListGroup,
} from 'react-bootstrap';
import { User } from 'react-feather';
import useMounted from '@/hooks/useMounted';
import { useAuth } from '@/hooks/useAuth';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';

const QuickMenu = () => {

    const { user, logout } = useAuth();
    const hasMounted = useMounted();
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const isDesktop = useMediaQuery({
        query: '(min-width: 1224px)'
    })

    const handleLogout = () => {
        logout();
    };

    const handleChangePasswordClick = () => {
        setShowChangePasswordModal(true);
    };

    const QuickMenuDesktop = () => {
        return (
            <ListGroup as="ul" bsPrefix='navbar-nav' className="navbar-right-wrap ms-auto d-flex nav-top-wrap">
                <Dropdown as="li" className="ms-2">
                    <Dropdown.Toggle
                        as="a"
                        bsPrefix=' '
                        className="rounded-circle"
                        id="dropdownUser">
                        <div className="avatar avatar-md avatar-indicators">
                            {user?.avatar ? (
                                <Image 
                                    alt="avatar" 
                                    src={user.avatar} 
                                    className="rounded-circle" 
                                    width={40}
                                    height={40}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#e9ecef',
                                        color: '#6c757d'
                                    }}
                                >
                                    <User size={24} />
                                </div>
                            )}
                        </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        className="dropdown-menu dropdown-menu-end "
                        align="end"
                        aria-labelledby="dropdownUser"
                        show
                    >
                        <Dropdown.Item as="div" className="px-2 pb-0 pt-2" bsPrefix=' '>
                            <div className="lh-1 text-center">
                                <h5 className="mb-1">{user?.firstName} {user?.lastName}</h5>
                            </div>
                            <div className=" dropdown-divider mt-3 mb-2"></div>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleChangePasswordClick}>
                            <i className="fe fe-lock me-2"></i>Şifre Değişikliği
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleLogout}>
                            <i className="fe fe-power me-2"></i>Çıkış Yap
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </ListGroup>
        )
    }

    const QuickMenuMobile = () => {
        return (
            <ListGroup as="ul" bsPrefix='navbar-nav' className="navbar-right-wrap ms-auto d-flex nav-top-wrap">
                <Dropdown as="li" className="ms-2">
                    <Dropdown.Toggle
                        as="a"
                        bsPrefix=' '
                        className="rounded-circle"
                        id="dropdownUser">
                        <div className="avatar avatar-md avatar-indicators">
                            {user?.avatar ? (
                                <Image 
                                    alt="avatar" 
                                    src={user.avatar} 
                                    className="rounded-circle" 
                                    width={40}
                                    height={40}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#e9ecef',
                                        color: '#6c757d'
                                    }}
                                >
                                    <User size={24} />
                                </div>
                            )}
                        </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        className="dropdown-menu dropdown-menu-end "
                        align="end"
                        aria-labelledby="dropdownUser"
                    >
                        <Dropdown.Item as="div" className="px-2 pb-0 pt-2" bsPrefix=' '>
                            <div className="lh-1  text-center">
                                <h5 className="mb-1">{user?.firstName} {user?.lastName}</h5>
                            </div>
                            <div className=" dropdown-divider mt-3 mb-2"></div>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleChangePasswordClick}>
                            <i className="fe fe-lock me-2"></i>Şifre Değişikliği
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleLogout}>
                            <i className="fe fe-power me-2"></i>Çıkış Yap
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </ListGroup>
        )
    }

    return (
        <Fragment>
            {hasMounted && isDesktop ? <QuickMenuDesktop /> : <QuickMenuMobile />}
            <ChangePasswordModal 
                show={showChangePasswordModal}
                onHide={() => setShowChangePasswordModal(false)}
            />
        </Fragment>
    )
}

export default QuickMenu;