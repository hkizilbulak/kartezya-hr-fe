'use client'
import { Fragment, useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { dashboardService, DashboardData, GenderChartData, PositionChartData, CompanyDepartmentChartData } from "@/services/dashboard.service";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import { leaveRequestService } from "@/services/leave-request.service";
import { leaveBalanceService } from "@/services/leave-balance.service";
import { employeeService } from "@/services/employee.service";
import { LeaveRequest, LeaveBalance } from "@/models/hr/common.types";

// Helper function to format dates from API (ISO strings) or local format (number arrays)
const formatDate = (date?: string | number[]): string => {
    if (!date) return "";
    
    // Handle string dates (ISO format from API)
    if (typeof date === 'string') {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return "";
        return dateObj.toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
    }
    
    // Handle number array format
    if (Array.isArray(date) && date.length === 3) {
        const dateObj = new Date(date[0], date[1] - 1, date[2]);
        return dateObj.toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
    }
    
    return "";
};

const Home = () => {
    const { user } = useAuth();
    const isEmployee = user?.roles?.includes('EMPLOYEE');

    // Admin/Manager state
    const [stats, setStats] = useState<DashboardData>({
        total_employees: 0,
        total_departments: 0,
        total_companies: 0,
        pending_leave_requests: 0
    });
    const [genderData, setGenderData] = useState<GenderChartData[]>([]);
    const [positionData, setPositionData] = useState<PositionChartData[]>([]);
    const [companyDeptData, setCompanyDeptData] = useState<CompanyDepartmentChartData[]>([]);

    // Employee state
    const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [employeeProfile, setEmployeeProfile] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    useEffect(() => {
        if (isEmployee) {
            fetchEmployeeDashboardData();
        } else {
            fetchAllDashboardData();
        }
    }, [isEmployee]);

    // Admin/Manager dashboard veri yükleme
    const fetchAllDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch main dashboard data
            const mainResponse = await dashboardService.getDashboardData();
            if (mainResponse.success && mainResponse.data) {
                setStats(mainResponse.data);
            }

            // Fetch gender chart data
            try {
                const genderResponse = await dashboardService.getEmployeesByGender();
                if (genderResponse.success && genderResponse.data) {
                    setGenderData(genderResponse.data);
                }
            } catch (error) {
                console.error('Error fetching gender data:', error);
            }

            // Fetch position chart data
            try {
                const positionResponse = await dashboardService.getEmployeesByPosition();
                if (positionResponse.success && positionResponse.data) {
                    setPositionData(positionResponse.data);
                }
            } catch (error) {
                console.error('Error fetching position data:', error);
            }

            // Fetch company-department chart data
            try {
                const companyDeptResponse = await dashboardService.getEmployeesByCompanyDepartment();
                if (companyDeptResponse.success && companyDeptResponse.data) {
                    setCompanyDeptData(companyDeptResponse.data);
                }
            } catch (error) {
                console.error('Error fetching company-department data:', error);
            }
        } catch (error: any) {
            console.error('Dashboard veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    // Employee dashboard veri yükleme
    const fetchEmployeeDashboardData = async () => {
        try {
            setLoading(true);

            // Çalışanın izin taleplerini yükle
            try {
                const requestsResponse = await leaveRequestService.getMyRequests();
                if (requestsResponse.success && requestsResponse.data) {
                    setMyLeaveRequests(requestsResponse.data);
                }
            } catch (error) {
                console.error('Error fetching leave requests:', error);
            }

            // Çalışanın izin bakiyesini yükle
            try {
                const balanceResponse = await leaveBalanceService.getMyLeaveBalance();
                if (balanceResponse.success && balanceResponse.data) {
                    setLeaveBalance(balanceResponse.data);
                }
            } catch (error) {
                console.error('Error fetching leave balance:', error);
            }

            // Çalışanın profil bilgisini yükle
            try {
                const profileResponse = await employeeService.getMyProfile();
                if (profileResponse.success && profileResponse.data) {
                    setEmployeeProfile(profileResponse.data);
                }
            } catch (error) {
                console.error('Error fetching employee profile:', error);
            }
        } catch (error: any) {
            console.error('Employee dashboard veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container fluid className="px-6 py-4">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    // EMPLOYEE Dashboard
    if (isEmployee) {
        // Tenure hesapla
        const calculateTenure = () => {
            if (!employeeProfile?.hire_date) return { years: 0, months: 0, days: 0, text: '' };
            
            const hireDate = new Date(employeeProfile.hire_date);
            const today = new Date();
            
            let years = today.getFullYear() - hireDate.getFullYear();
            let months = today.getMonth() - hireDate.getMonth();
            let days = today.getDate() - hireDate.getDate();
            
            if (days < 0) {
                months--;
                const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                days += lastMonth.getDate();
            }
            
            if (months < 0) {
                years--;
                months += 12;
            }
            
            let text = '';
            if (years > 0) text += `${years} yıl `;
            if (months > 0) text += `${months} ay `;
            if (days > 0) text += `${days} gün`;
            
            return { years, months, days, text: text.trim() || '0 gün' };
        };

        const tenure = calculateTenure();

        return (
            <Fragment>
                <Container fluid className="px-6 py-4">
                    {/* Hoş Geldiniz Mesajı */}
                    <Row className="mb-4">
                        <Col lg={12} md={12} xs={12}>
                            <h4 className="mb-2">Hoş geldiniz, {employeeProfile?.first_name} {employeeProfile?.last_name}! 👋</h4>
                        </Col>
                    </Row>

                    {/* Statistik Kartları */}
                    <Row className="mb-4">
                        {/* İzin Bakiyesi */}
                        <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h4 className="mb-0">İzin Bakiyesi</h4>
                                        </div>
                                        <div className="icon-shape icon-md bg-light-success text-success rounded-2">
                                            <i className="fe fe-calendar fs-4"></i>
                                        </div>
                                    </div>
                                    <div>
                                        {leaveBalance ? (
                                            <>
                                                <h1 className="fw-bold">{leaveBalance.remaining_days || 0}</h1>
                                                <p className="mb-0">
                                                    <span className="text-success me-2">
                                                        <i className="fe fe-check-circle me-1"></i>
                                                    </span>
                                                    Kalan gün
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-muted">Bilgi yükleniyor...</p>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Onay Bekleyen Talepler */}
                        <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h4 className="mb-0">Onay Bekleyen</h4>
                                        </div>
                                        <div className="icon-shape icon-md bg-light-warning text-warning rounded-2">
                                            <i className="fe fe-clock fs-4"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="fw-bold">
                                            {myLeaveRequests.filter(r => r.status === 'PENDING').length}
                                        </h1>
                                        <p className="mb-0">
                                            <span className="text-warning me-2">
                                                <i className="fe fe-alert-circle me-1"></i>
                                            </span>
                                            Beklemede olan
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Onaylanan Talepler */}
                        <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h4 className="mb-0">Onaylanan</h4>
                                        </div>
                                        <div className="icon-shape icon-md bg-light-info text-info rounded-2">
                                            <i className="fe fe-check fs-4"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="fw-bold">
                                            {myLeaveRequests.filter(r => r.status === 'APPROVED').length}
                                        </h1>
                                        <p className="mb-0">
                                            <span className="text-info me-2">
                                                <i className="fe fe-check-circle me-1"></i>
                                            </span>
                                            Onaylanan talepler
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Reddedilen Talepler */}
                        <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h4 className="mb-0">Reddedilen</h4>
                                        </div>
                                        <div className="icon-shape icon-md bg-light-danger text-danger rounded-2">
                                            <i className="fe fe-x fs-4"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="fw-bold">
                                            {myLeaveRequests.filter(r => r.status === 'REJECTED').length}
                                        </h1>
                                        <p className="mb-0">
                                            <span className="text-danger me-2">
                                                <i className="fe fe-x-circle me-1"></i>
                                            </span>
                                            Reddedilen talepler
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Ne zamandır Bizimlesin ve Çalışan Kartı */}
                    <Row className="mb-4">

                        {/* Çalışan Kartı */}
                        <Col xl={6} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h5 className="mb-0 text-white-50">Çalışan Kartı</h5>
                                        </div>
                                        <div style={{ fontSize: '2.5rem' }}>👤</div>
                                    </div>
                                    <div className="row">
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Ad Soyad</h6>
                                            <p className="mb-0 fw-bold text-white">{employeeProfile?.first_name} {employeeProfile?.last_name}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Şirket E-postası</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.company_email || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">İşe Başlama Tarihi</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.hire_date ? formatDate(employeeProfile.hire_date) : 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Çalışılan Şirket</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information?.company_name || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Departman</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information?.department_name || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Pozisyon</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information?.job_title || 'N/A'}</p>
                                        </Col>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        {/* Ne zamandır Bizimlesin */}
                        <Col xl={6} lg={6} md={12} xs={12} className="mb-6">
                            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h5 className="mb-0 text-white-50">Ne zamandır Bizimlesin?</h5>
                                        </div>
                                        <div style={{ fontSize: '2.5rem' }}>🎉</div>
                                    </div>
                                    <div>
                                        <h1 className="fw-bold mb-2">{tenure.text}</h1>
                                        <p className="mb-0 text-white-50">
                                            <i className="fe fe-calendar me-2"></i>
                                            İşe başlama: {employeeProfile?.hire_date ? formatDate(employeeProfile.hire_date) : 'N/A'}
                                        </p>
                                        <p className="mt-3 mb-0 text-white-75">
                                            Başarılı bir yolculuğun parçası olduğun için teşekkür ederiz! 🙏
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        
                    </Row>

                    {/* Son İzin Taleplerini Tablo Olarak Göster */}
                    <Row>
                        <Col lg={12} md={12} xs={12} className="mb-6">
                            <Card className="border-0">
                                <Card.Header>
                                    <h5 className="mb-0">Son İzin Taleplerini</h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {myLeaveRequests.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Başlama Tarihi</th>
                                                        <th>Bitiş Tarihi</th>
                                                        <th>Tür</th>
                                                        <th>Gün Sayısı</th>
                                                        <th>Durum</th>
                                                        <th>Tarih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myLeaveRequests.slice(0, 5).map((request) => (
                                                        <tr key={request.id}>
                                                            <td>{formatDate(request.start_date)}</td>
                                                            <td>{formatDate(request.end_date)}</td>
                                                            <td>{request.leave_type?.name || 'N/A'}</td>
                                                            <td>
                                                                <span className="badge bg-primary">
                                                                    {request.requested_days}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${
                                                                    request.status === 'APPROVED' ? 'success' :
                                                                    request.status === 'REJECTED' ? 'danger' :
                                                                    request.status === 'CANCELLED' ? 'secondary' :
                                                                    'warning'
                                                                }`}>
                                                                    {request.status === 'PENDING' ? 'Beklemede' :
                                                                    request.status === 'APPROVED' ? 'Onaylı' :
                                                                    request.status === 'REJECTED' ? 'Reddedildi' :
                                                                    request.status === 'CANCELLED' ? 'İptal Edildi' :
                                                                    request.status}
                                                                </span>
                                                            </td>
                                                            <td>{formatDate(request.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-muted">
                                            <p>Henüz izin talebiniz yok</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </Fragment>
        );
    }

    // ADMIN/MANAGER Dashboard
    return (
        <Fragment>
            <Container fluid className="px-6 py-4">
                <Row>
                    <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Toplam Çalışan</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-primary text-primary rounded-2">
                                        <i className="fe fe-users fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">{stats.total_employees}</h1>
                                    <p className="mb-0">
                                        <span className="text-success me-2">
                                            <i className="fe fe-trending-up me-1"></i>
                                        </span>
                                        Aktif çalışanlar
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Şirketler</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-danger text-danger rounded-2">
                                        <i className="fe fe-building fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">{stats.total_companies}</h1>
                                    <p className="mb-0">
                                        <span className="text-dark me-2">
                                            <i className="fe fe-building me-1"></i>
                                        </span>
                                        Toplam şirket
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Departmanlar</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-warning text-warning rounded-2">
                                        <i className="fe fe-briefcase fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">{stats.total_departments}</h1>
                                    <p className="mb-0">
                                        <span className="text-dark me-2">
                                            <i className="fe fe-users me-1"></i>
                                        </span>
                                        Toplam departman
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Onay Bekleyen İzinler</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-info text-info rounded-2">
                                        <i className="fe fe-calendar fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">{stats.pending_leave_requests}</h1>
                                    <p className="mb-0">
                                        <span className="text-info me-2">
                                            <i className="fe fe-clock me-1"></i>
                                        </span>
                                        Onay bekleyen
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row */}
                <Row className="mt-4">
                    {/* Gender Chart */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Cinsiyete Göre Çalışan Sayısı</h5>
                            </Card.Header>
                            <Card.Body>
                                {genderData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={genderData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ gender, count }: any) => `${gender}: ${count}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {genderData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <p>Veri bulunamadı</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Position Chart */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Pozisyona Göre Çalışan Sayısı</h5>
                            </Card.Header>
                            <Card.Body>
                                {positionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={positionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="position_title" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <p>Veri bulunamadı</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Company-Department Chart */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Şirket-Departmana Göre Çalışan Sayısı</h5>
                            </Card.Header>
                            <Card.Body>
                                {companyDeptData.length > 0 ? (
                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Şirket</th>
                                                    <th>Departman</th>
                                                    <th>Sayı</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyDeptData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.company_name}</td>
                                                        <td>{item.department_name}</td>
                                                        <td>
                                                            <span className="badge bg-primary">{item.count}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <p>Veri bulunamadı</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col lg={12} md={12} xs={12} className="mb-6">
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">Kartezya HR Yönetim Sistemine Hoşgeldiniz</h4>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <p>
                                    Bu sistem ile çalışanlarınızı, departmanlarınızı ve izin süreçlerinizi kolayca yönetebilirsiniz.
                                </p>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <h6>👥 Çalışan Yönetimi</h6>
                                        <p className="text-muted">Çalışan bilgilerini ekleyin, düzenleyin ve yönetin.</p>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <h6>🏢 Departman Yönetimi</h6>
                                        <p className="text-muted">Departmanları organize edin ve pozisyonları belirleyin.</p>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <h6>📅 İzin Yönetimi</h6>
                                        <p className="text-muted">İzin taleplerini onaylayın ve raporlayın.</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Fragment>
    )
}
export default Home;
