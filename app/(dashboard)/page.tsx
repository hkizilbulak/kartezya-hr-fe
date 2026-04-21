'use client'
import { Fragment, useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { dashboardService, DashboardData, GenderChartData, PositionChartData, CompanyDepartmentChartData, GradeChartData } from "@/services/dashboard.service";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useAuth } from "@/hooks/useAuth";
import { leaveRequestService } from "@/services/leave-request.service";
import { leaveBalanceService } from "@/services/leave-balance.service";
import { employeeService } from "@/services/employee.service";
import { LeaveRequest, LeaveBalance } from "@/models/hr/hr-models";
import { useRouter } from 'next/navigation';
import LoadingOverlay from "@/components/LoadingOverlay";

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
    const router = useRouter();
    const isAdmin = user?.roles?.includes('ADMIN');

    // Admin/Manager state
    const [stats, setStats] = useState<DashboardData>({
        total_employees: 0,
        total_departments: 0,
        total_companies: 0,
        pending_leave_requests: 0,
        pending_expense_requests: 0,
        pending_payment_expenses: 0,
        paid_expenses: 0
    });
    const [genderData, setGenderData] = useState<GenderChartData[]>([]);
    const [positionData, setPositionData] = useState<PositionChartData[]>([]);
    const [companyDeptData, setCompanyDeptData] = useState<CompanyDepartmentChartData[]>([]);
    const [gradeData, setGradeData] = useState<GradeChartData[]>([]);

    // Employee state
    const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [employeeProfile, setEmployeeProfile] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    // Per-component loading states
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingGenderData, setLoadingGenderData] = useState(false);
    const [loadingPositionData, setLoadingPositionData] = useState(false);
    const [loadingCompanyDeptData, setLoadingCompanyDeptData] = useState(false);
    const [loadingGradeData, setLoadingGradeData] = useState(false);
    const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
    const [loadingLeaveBalance, setLoadingLeaveBalance] = useState(false);
    const [loadingEmployeeProfile, setLoadingEmployeeProfile] = useState(false);

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Sadece bir kez çalışsın
        if (initialized) return;

        const initializeDashboard = async () => {
            setLoading(true);
            setInitialized(true);

            if (isAdmin) {
                await fetchAllDashboardData();
            } else {
                await fetchEmployeeDashboardData();
            }

            setLoading(false);
        };

        // user bilgisi hazır olduğunda çalıştır
        if (user) {
            initializeDashboard();
        }
    }, [user, initialized, isAdmin]);

    // Admin/Manager dashboard veri yükleme
    const fetchAllDashboardData = async () => {
        try {
            setLoadingStats(true);
            setLoadingGenderData(true);
            setLoadingPositionData(true);
            setLoadingCompanyDeptData(true);

            // Fetch main dashboard data
            try {
                const mainResponse = await dashboardService.getDashboardData();
                if (mainResponse.success && mainResponse.data) {
                    setStats(mainResponse.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoadingStats(false);
            }

            // Fetch gender chart data
            try {
                const genderResponse = await dashboardService.getEmployeesByGender();
                if (genderResponse.success && genderResponse.data) {
                    setGenderData(genderResponse.data);
                }
            } catch (error) {
                console.error('Error fetching gender data:', error);
            } finally {
                setLoadingGenderData(false);
            }

            // Fetch position chart data
            try {
                const positionResponse = await dashboardService.getEmployeesByPosition();
                if (positionResponse.success && positionResponse.data) {
                    const grouped: Record<string, number> = {};

                    positionResponse.data.forEach(item => {
                        const title = item.position_title;
                        let groupName = 'Diğer';

                        if (/\b(fe|frontend|front\s?end)\b/i.test(title) || /fe\s/i.test(title)) {
                            groupName = 'Fe Dev.';
                        } else if (/android|ios|mobile/i.test(title)) {
                            groupName = 'Mobile Dev.';
                        } else if (/analyst|product owner/i.test(title)) {
                            groupName = 'Analyst';
                        } else if (/intern|stajyer/i.test(title)) {
                            groupName = 'Intern';
                        } else if (/\b(hr|ik)\b|insan/i.test(title) || /hr\s/i.test(title)) {
                            groupName = 'Hr';
                        } else if (/manager|lead/i.test(title)) {
                            groupName = 'Manager';
                        } else if (/qa/i.test(title)) {
                            groupName = 'QA';
                        } else if (/designer/i.test(title)) {
                            groupName = 'Designer';
                        } else if (/developer|engineer|architect/i.test(title)) {
                            groupName = 'Developer';
                        }

                        grouped[groupName] = (grouped[groupName] || 0) + item.count;
                    });

                    const groupedData = Object.keys(grouped).map(key => ({
                        position_title: key,
                        count: grouped[key]
                    })).sort((a, b) => b.count - a.count);

                    setPositionData(groupedData);
                }
            } catch (error) {
                console.error('Error fetching position data:', error);
            } finally {
                setLoadingPositionData(false);
            }

            // Fetch company-department chart data
            try {
                const companyDeptResponse = await dashboardService.getEmployeesByCompanyDepartment();
                if (companyDeptResponse.success && companyDeptResponse.data) {
                    setCompanyDeptData(companyDeptResponse.data);
                }
            } catch (error) {
                console.error('Error fetching company-department data:', error);
            } finally {
                setLoadingCompanyDeptData(false);
            }

            setLoadingGradeData(true);
            try {
                const gradeResponse = await dashboardService.getEmployeesByGrade();
                if (gradeResponse.success && gradeResponse.data) {
                    setGradeData(gradeResponse.data);
                }
            } catch (error) {
                console.error('Error fetching grade data:', error);
            } finally {
                setLoadingGradeData(false);
            }
        } catch (error: any) {
            console.error('Dashboard veri yükleme hatası:', error);
        }
    };

    // Employee dashboard veri yükleme
    const fetchEmployeeDashboardData = async () => {
        try {
            setLoadingLeaveRequests(true);
            setLoadingLeaveBalance(true);
            setLoadingEmployeeProfile(true);

            // Çalışanın izin taleplerini yükle
            try {
                const requestsResponse = await leaveRequestService.getMyRequests();
                if (requestsResponse.success && requestsResponse.data) {
                    setMyLeaveRequests(requestsResponse.data);
                }
            } catch (error) {
                console.error('Error fetching leave requests:', error);
            } finally {
                setLoadingLeaveRequests(false);
            }

            // Çalışanın izin bakiyesini yükle
            try {
                const balanceResponse = await leaveBalanceService.getMyLeaveBalance();
                if (balanceResponse.success && balanceResponse.data) {
                    setLeaveBalance(balanceResponse.data);
                }
            } catch (error) {
                console.error('Error fetching leave balance:', error);
            } finally {
                setLoadingLeaveBalance(false);
            }

            // Çalışanın profil bilgisini yükle
            try {
                const profileResponse = await employeeService.getMyProfile();
                if (profileResponse.success && profileResponse.data) {
                    setEmployeeProfile(profileResponse.data);
                }
            } catch (error) {
                console.error('Error fetching employee profile:', error);
            } finally {
                setLoadingEmployeeProfile(false);
            }
        } catch (error: any) {
            console.error('Employee dashboard veri yükleme hatası:', error);
        }
    };

    // EMPLOYEE Dashboard
    if (!isAdmin) {
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
                {/* Full screen overlay when loading */}
                <Container fluid className="px-6 py-4">
                    <LoadingOverlay show={loading} message="Yükleniyor..." />

                    {/* Hoş Geldiniz Mesajı */}
                    <Row className="mb-4">
                        <Col lg={12} md={12} xs={12}>
                            <h4 className="mb-2">Hoş geldiniz, {employeeProfile?.first_name} {employeeProfile?.last_name}! 👋</h4>
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
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information && employeeProfile.work_information.length > 0 ? employeeProfile.work_information[0]?.company_name : 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Departman</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information && employeeProfile.work_information.length > 0 ? employeeProfile.work_information[0]?.department_name : 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <h6 className="text-white-50 mb-1">Pozisyon</h6>
                                            <p className="mb-0 text-white-75">{employeeProfile?.work_information && employeeProfile.work_information.length > 0 ? employeeProfile.work_information[0]?.job_title : 'N/A'}</p>
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
                                        <h1 className="fw-bold">
                                            {loadingLeaveBalance ? (
                                                <Spinner animation="border" role="status" size="sm">
                                                    <span className="visually-hidden">Yükleniyor...</span>
                                                </Spinner>
                                            ) : leaveBalance?.remaining_days || 0}
                                        </h1>
                                        <p className="mb-0">
                                            <span className="text-success me-2">
                                                <i className="fe fe-calendar me-1"></i>
                                            </span>
                                            Kalan gün
                                        </p>
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
                                            {loadingLeaveRequests ? (
                                                <Spinner animation="border" role="status" size="sm">
                                                    <span className="visually-hidden">Yükleniyor...</span>
                                                </Spinner>
                                            ) : myLeaveRequests.filter(r => r.status === 'PENDING').length}
                                        </h1>
                                        <p className="mb-0">
                                            <span className="text-warning me-2">
                                                <i className="fe fe-clock me-1"></i>
                                            </span>
                                            Onay bekleyen talepler
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
                                            {loadingLeaveRequests ? (
                                                <Spinner animation="border" role="status" size="sm">
                                                    <span className="visually-hidden">Yükleniyor...</span>
                                                </Spinner>
                                            ) : myLeaveRequests.filter(r => r.status === 'APPROVED').length}
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
                                            {loadingLeaveRequests ? (
                                                <Spinner animation="border" role="status" size="sm">
                                                    <span className="visually-hidden">Yükleniyor...</span>
                                                </Spinner>
                                            ) : myLeaveRequests.filter(r => r.status === 'REJECTED').length}
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

                    {/* Bekleyen İzin Taleplerim ve Kariyer Geçmişi Timeline */}
                    <Row className="mb-4">
                        <Col lg={6} md={12} xs={12} className="mb-6">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>Bekleyen İzin Taleplerim</h6>
                                <a href="/my-requests/leave" className="text-decoration-none" style={{ fontSize: '14px', fontWeight: 500 }}>
                                    Tümü →
                                </a>
                            </div>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-0">
                                    <div className="table-box">
                                        <div className="table-responsive">
                                            {myLeaveRequests.filter(r => r.status === 'PENDING').length > 0 ? (
                                                <table className="table table-hover mb-0">
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                                            <th style={{ padding: '12px 16px' }}>Başlangıç Tarihi</th>
                                                            <th style={{ padding: '12px 16px' }}>Bitiş Tarihi</th>
                                                            <th style={{ padding: '12px 16px' }}>İzin Türü</th>
                                                            <th style={{ padding: '12px 16px' }}>Kullanılan Gün</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {myLeaveRequests.filter(r => r.status === 'PENDING').map((request) => (
                                                            <tr key={request.id}>
                                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{formatDate(request.start_date)}</td>
                                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{formatDate(request.end_date)}</td>
                                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{request.leave_type?.name || 'N/A'}</td>
                                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{request.requested_days || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-5 text-center text-muted">
                                                    <p>Bekleyen izin talebiniz yok</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Kariyer Geçmişi Timeline */}
                        <Col lg={6} md={12} xs={12} className="mb-6">
                            <h6 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '1rem', fontFamily: 'Poppins, sans-serif' }}>Kariyer Geçmişim</h6>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className={
                                    employeeProfile?.work_information &&
                                        employeeProfile.work_information.length > 0
                                        ? ""
                                        : "p-0"
                                }>
                                    {employeeProfile?.work_information && employeeProfile.work_information.length > 0 ? (
                                        <div style={{ position: 'relative', paddingLeft: '20px' }}>
                                            {employeeProfile.work_information.map((workInfo: any, index: number) => (
                                                <div key={workInfo.id} style={{ marginBottom: '20px', position: 'relative' }}>
                                                    {/* Timeline dot */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            left: '-25px',
                                                            top: '6px',
                                                            width: '12px',
                                                            height: '12px',
                                                            backgroundColor: '#624bff',
                                                            borderRadius: '50%',
                                                            border: '3px solid white',
                                                            boxShadow: '0 0 0 2px #624bff',
                                                        }}
                                                    />

                                                    {/* Timeline line (sadece son item hariç) */}
                                                    {index < employeeProfile.work_information.length - 1 && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                left: '-20px',
                                                                top: '24px',
                                                                width: '2px',
                                                                height: '40px',
                                                                backgroundColor: '#e5e7eb',
                                                            }}
                                                        />
                                                    )}

                                                    {/* Timeline content */}
                                                    <div>
                                                        <h6 style={{ marginBottom: '4px', fontWeight: 600, color: '#111827', fontFamily: 'Poppins, sans-serif' }}>
                                                            {workInfo.job_title}
                                                        </h6>
                                                        <p style={{ marginBottom: '4px', fontSize: '13px', color: '#6b7280', fontFamily: 'Poppins, sans-serif' }}>
                                                            <strong>{workInfo.company_name}</strong> • {workInfo.department_name}
                                                        </p>
                                                        <p style={{ marginBottom: '8px', fontSize: '12px', color: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}>
                                                            {formatDate(workInfo.start_date)}
                                                            {workInfo.end_date ? ` → ${formatDate(workInfo.end_date)}` : ' → Devam Ediyor'}
                                                        </p>
                                                        {workInfo.manager && (
                                                            <p style={{ marginBottom: '0', fontSize: '12px', color: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}>
                                                                👤 Yönetici: {workInfo.manager}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-muted">
                                            <p>Kariyer geçmişi bulunamadı</p>
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
                <LoadingOverlay show={loading} message="Yükleniyor..." />

                <Row>
                    <Col xl={3} lg={6} md={12} xs={12} className="mb-6">
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/employees')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.total_employees}
                                    </h1>
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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/companies')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.total_companies}
                                    </h1>
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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/departments')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.total_departments}
                                    </h1>
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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/leave-management/requests')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.pending_leave_requests}
                                    </h1>
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

                <Row>
                    <Col xl={4} lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/expenses')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Onay Bekleyen Masraflar</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-warning text-warning rounded-2">
                                        <i className="fe fe-refresh-cw fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.pending_expense_requests}
                                    </h1>
                                    <p className="mb-0">
                                        <span className="text-warning me-2">
                                            <i className="fe fe-clock me-1"></i>
                                        </span>
                                        Onay bekleyen
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={4} lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/expenses')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Ödeme Bekleyen Masraflar</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-danger text-danger rounded-2">
                                        <i className="fe fe-credit-card fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.pending_payment_expenses}
                                    </h1>
                                    <p className="mb-0">
                                        <span className="text-danger me-2">
                                            <i className="fe fe-clock me-1"></i>
                                        </span>
                                        Ödeme bekleyen
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={4} lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/expenses')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Ödenen Masraflar</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-success text-success rounded-2">
                                        <i className="fe fe-check-circle fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.paid_expenses}
                                    </h1>
                                    <p className="mb-0">
                                        <span className="text-success me-2">
                                            <i className="fe fe-check me-1"></i>
                                        </span>
                                        Ödenen
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row */}
                <Row className="mt-4">
                    {/* Position Chart (Moved to first place) */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Çalışanların Pozisyon Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                {loadingPositionData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : positionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={positionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="position_title" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count">
                                                <LabelList dataKey="count" position="top" fill="#666" fontSize={12} fontWeight={600} />
                                                {positionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Grade Chart (Moved next to Position) */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Çalışanların Grade Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                {loadingGradeData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : gradeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={gradeData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="grade_name" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count">
                                                <LabelList dataKey="count" position="top" fill="#666" fontSize={12} fontWeight={600} />
                                                {gradeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Gender Chart (Moved to second place) */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0">
                            <Card.Header>
                                <h5 className="mb-0">Çalışanların Cinsiyet Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                {loadingGenderData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : genderData.length > 0 ? (
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
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
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
                                {loadingCompanyDeptData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : companyDeptData.length > 0 ? (
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
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
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
