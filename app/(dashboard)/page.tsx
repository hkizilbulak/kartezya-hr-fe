'use client'
import { Fragment, useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Spinner, OverlayTrigger, Popover } from "react-bootstrap";
import { dashboardService, DashboardData, GenderChartData, PositionChartData, CompanyDepartmentChartData, GradeChartData } from "@/services/dashboard.service";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useAuth } from "@/hooks/useAuth";
import { leaveRequestService } from "@/services/leave-request.service";
import { leaveBalanceService } from "@/services/leave-balance.service";
import { employeeService } from "@/services/employee.service";
import { LeaveRequest, LeaveBalance } from "@/models/hr/hr-models";
import { useRouter } from 'next/navigation';
import LoadingOverlay from "@/components/LoadingOverlay";
import EventsWidget from '@/components/widgets/EventsWidget';
import { Capability, hasCapability } from '@/lib/authz/capabilities';

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

const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || !payload.value) return null;

    const value = String(payload.value);
    const parts = value.split(' ');

    return (
        <g transform={`translate(${x},${y})`}>
            {parts.map((part, index) => (
                <text
                    key={index}
                    x={0}
                    y={index * 10}
                    dy={10}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize={8.5}
                    fontWeight={600}
                >
                    {part}
                </text>
            ))}
        </g>
    );
};

const CustomCompanyYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || !payload.value) return null;

    const companyName = String(payload.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={-10}
                y={-4}
                textAnchor="end"
                fill="#475569"
                fontSize={10.5}
                fontWeight={600}
            >
                {companyName}
            </text>
            <text
                x={-10}
                y={10}
                textAnchor="end"
                fill="#db2777"
                fontSize={9}
                fontWeight={600}
            >
                Stajyer
            </text>
        </g>
    );
};

const Home = () => {
    const { user } = useAuth();
    const router = useRouter();
    const canAccessAdminModules = hasCapability(user?.roles, Capability.CanAccessAdminModules);

    // Admin/Manager state
    const [stats, setStats] = useState<DashboardData>({
        total_employees: 0,
        total_departments: 0,
        total_companies: 0,
        pending_leave_requests: 0,
        pending_expense_requests: 0,
        pending_payment_expenses: 0,
        paid_expenses: 0,
        active_events: 0
    });
    const [genderData, setGenderData] = useState<GenderChartData[]>([]);
    const [positionData, setPositionData] = useState<PositionChartData[]>([]);
    const [companyDeptData, setCompanyDeptData] = useState<CompanyDepartmentChartData[]>([]);
    const [internCompanyDeptData, setInternCompanyDeptData] = useState<CompanyDepartmentChartData[]>([]);
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
    const [loadingInternCompanyDeptData, setLoadingInternCompanyDeptData] = useState(false);
    const [loadingGradeData, setLoadingGradeData] = useState(false);
    const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
    const [loadingLeaveBalance, setLoadingLeaveBalance] = useState(false);
    const [loadingEmployeeProfile, setLoadingEmployeeProfile] = useState(false);

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const GENDER_COLORS: Record<string, string> = {
        'Erkek': 'url(#genderMaleGrad)',
        'Kadın': 'url(#genderFemaleGrad)',
        'Belirsiz': 'url(#genderOtherGrad)'
    };

    const GENDER_LEGEND_COLORS: Record<string, string> = {
        'Erkek': '#4f46e5',
        'Kadın': '#db2777',
        'Belirsiz': '#64748b'
    };

    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Sadece bir kez çalışsın
        if (initialized) return;

        const initializeDashboard = async () => {
            setInitialized(true);

            if (canAccessAdminModules) {
                await fetchAllDashboardData();
            } else {
                await fetchEmployeeDashboardData();
            }
        };

        // user bilgisi hazır olduğunda çalıştır
        if (user) {
            initializeDashboard();
        }
    }, [user, initialized, canAccessAdminModules]);

    // Admin/Manager dashboard veri yükleme
    const fetchAllDashboardData = async () => {
        try {
            setLoadingStats(true);
            setLoadingGenderData(true);
            setLoadingPositionData(true);
            setLoadingCompanyDeptData(true);
            setLoadingInternCompanyDeptData(true);

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
                    const mappedData = genderResponse.data.map(item => {
                        let displayGender = item.gender;
                        if (!displayGender || displayGender.trim() === '') {
                            displayGender = 'Belirsiz';
                        } else if (displayGender === 'MALE' || displayGender === 'Male') {
                            displayGender = 'Erkek';
                        } else if (displayGender === 'FEMALE' || displayGender === 'Female') {
                            displayGender = 'Kadın';
                        }
                        return {
                            ...item,
                            gender: displayGender
                        };
                    });
                    setGenderData(mappedData);
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

            try {
                const internCompanyDeptResponse = await dashboardService.getInternsByCompanyDepartment();
                if (internCompanyDeptResponse.success && internCompanyDeptResponse.data) {
                    setInternCompanyDeptData(internCompanyDeptResponse.data);
                }
            } catch (error) {
                console.error('Error fetching intern company-department data:', error);
            } finally {
                setLoadingInternCompanyDeptData(false);
            }

            setLoadingGradeData(true);
            try {
                const gradeResponse = await dashboardService.getEmployeesByGrade();
                if (gradeResponse.success && gradeResponse.data) {
                    const sortedGradeData = [...gradeResponse.data].sort((a, b) => b.count - a.count);
                    setGradeData(sortedGradeData);
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

    const companyData = useMemo(() => {
        const counts = companyDeptData.reduce((acc, curr) => {
            acc[curr.company_name] = (acc[curr.company_name] || 0) + curr.count;
            return acc;
        }, {} as Record<string, number>);

        const internCounts = internCompanyDeptData.reduce((acc, curr) => {
            acc[curr.company_name] = (acc[curr.company_name] || 0) + curr.count;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, count]) => ({
            company_name: name,
            count,
            internCount: internCounts[name] || 0
        })).sort((a, b) => b.count - a.count);
    }, [companyDeptData, internCompanyDeptData]);

    // EMPLOYEE Dashboard
    if (!canAccessAdminModules) {
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

                    <EventsWidget />

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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/expense-management/requests')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/expense-management/requests')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                        <Card className="border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => router.push('/events')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="mb-0">Aktif Etkinlikler</h4>
                                    </div>
                                    <div className="icon-shape icon-md bg-light-primary text-primary rounded-2">
                                        <i className="fe fe-calendar fs-4"></i>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="fw-bold">
                                        {loadingStats ? (
                                            <Spinner animation="border" role="status" size="sm">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        ) : stats.active_events}
                                    </h1>
                                    <p className="mb-0">
                                        <span className="text-primary me-2">
                                            <i className="fe fe-activity me-1"></i>
                                        </span>
                                        Yayında olan etkinlikler
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
                        <Card className="border-0 h-100">
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
                                        <BarChart layout="vertical" data={positionData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="positionGrad" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                type="category"
                                                dataKey="position_title"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#475569', fontSize: 10.5, fontWeight: 600 }}
                                                width={90}
                                            />

                                            <Bar
                                                dataKey="count"
                                                fill="url(#positionGrad)"
                                                radius={[0, 6, 6, 0]}
                                                maxBarSize={16}
                                                background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] }}
                                            >
                                                <LabelList dataKey="count" position="right" fill="#4f46e5" fontSize={10} fontWeight={700} offset={8} />
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
                        <Card className="border-0 h-100">
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
                                        <BarChart layout="vertical" data={gradeData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="gradeGrad" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#db2777" stopOpacity={0.85} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                type="category"
                                                dataKey="grade_name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#475569', fontSize: 10.5, fontWeight: 600 }}
                                                width={90}
                                            />

                                            <Bar
                                                dataKey="count"
                                                fill="url(#gradeGrad)"
                                                radius={[0, 6, 6, 0]}
                                                maxBarSize={16}
                                                background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] }}
                                            >
                                                <LabelList dataKey="count" position="right" fill="#db2777" fontSize={10} fontWeight={700} offset={8} />
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

                    {/* Company Chart (New Widget) */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0 h-100">
                            <Card.Header>
                                <h5 className="mb-0">Şirkete Göre Çalışan Sayısı</h5>
                            </Card.Header>
                            <Card.Body>
                                {loadingCompanyDeptData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : companyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart layout="vertical" data={companyData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }} barCategoryGap="30%" barGap={2}>
                                            <defs>
                                                <linearGradient id="companyGrad" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                                                </linearGradient>
                                                <linearGradient id="internCompanyGrad" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#db2777" stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                type="category"
                                                dataKey="company_name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={(tickProps: any) => (
                                                    <CustomCompanyYAxisTick
                                                        {...tickProps}
                                                        companyData={companyData}
                                                    />
                                                )}
                                                width={100}
                                            />

                                             <Bar
                                                dataKey="count"
                                                name="Çalışan"
                                                fill="url(#companyGrad)"
                                                radius={[0, 6, 6, 0]}
                                                barSize={16}
                                                background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] }}
                                            >
                                                <LabelList dataKey="count" position="right" fill="#4f46e5" fontSize={10} fontWeight={700} offset={8} />
                                            </Bar>
                                            <Bar
                                                dataKey="internCount"
                                                name="Stajyer"
                                                fill="url(#internCompanyGrad)"
                                                radius={[0, 6, 6, 0]}
                                                barSize={16}
                                                minPointSize={2}
                                                background={{ fill: '#fdf2f8', radius: [0, 6, 6, 0] }}
                                            >
                                                <LabelList dataKey="internCount" position="right" fill="#db2777" fontSize={9} fontWeight={700} offset={8} />
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

                    {/* Company-Department Chart */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0 h-100">
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
                                    <div
                                        className="d-flex flex-column gap-2 custom-scrollbar"
                                        style={{
                                            height: '300px',
                                            overflowY: 'auto',
                                            paddingRight: '4px',
                                            scrollbarWidth: 'thin'
                                        }}
                                    >
                                        {companyDeptData.map((item, index) => (
                                            <OverlayTrigger
                                                key={index}
                                                trigger={['hover', 'focus']}
                                                placement="right"
                                                overlay={
                                                    <Popover id={`popover-employees-${index}`} style={{
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                                        background: '#ffffff',
                                                        padding: '12px',
                                                        minWidth: '220px',
                                                        maxWidth: '280px',
                                                        zIndex: 1060
                                                    }}>
                                                        <div className="d-flex align-items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
                                                            <span className="fw-semibold text-dark" style={{ fontSize: '12px' }}>{item.department_name} ({item.company_name})</span>
                                                        </div>
                                                        <div className="d-flex flex-column gap-1 custom-scrollbar" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px', scrollbarWidth: 'thin' }}>
                                                            {item.employee_names ? (
                                                                item.employee_names.split(', ').map((name, i) => (
                                                                    <div key={i} className="d-flex align-items-center gap-2 px-2 py-1 rounded" style={{
                                                                        background: '#f8fafc',
                                                                        fontSize: '11.5px',
                                                                        color: '#334155',
                                                                        fontWeight: 500
                                                                    }}>
                                                                        <i className="fe fe-user text-primary" style={{ fontSize: '11px' }}></i>
                                                                        <span>{name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-muted text-center py-2" style={{ fontSize: '11px' }}>Çalışan bilgisi bulunamadı</div>
                                                            )}
                                                        </div>
                                                    </Popover>
                                                }
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-between p-2 rounded-3"
                                                    style={{
                                                        background: 'rgba(248, 249, 250, 0.7)',
                                                        border: '1px solid rgba(0, 0, 0, 0.05)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(13, 110, 253, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                        e.currentTarget.style.background = 'rgba(248, 249, 250, 0.7)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                                                        <div
                                                            className="d-flex align-items-center justify-content-center rounded-circle text-primary"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                background: 'rgba(13, 110, 253, 0.1)',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <i className="fe fe-briefcase fs-5"></i>
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h6 className="mb-0 text-dark fw-semibold text-truncate" title={item.department_name}>
                                                                {item.department_name}
                                                            </h6>
                                                            <small className="text-muted d-block text-truncate" title={item.company_name}>
                                                                {item.company_name}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="d-flex align-items-center justify-content-center fw-bold rounded-pill text-primary"
                                                        style={{
                                                            minWidth: '28px',
                                                            height: '22px',
                                                            padding: '0 8px',
                                                            background: 'rgba(13, 110, 253, 0.15)',
                                                            fontSize: '11px',
                                                            flexShrink: 0,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {item.count}
                                                    </div>
                                                </div>
                                            </OverlayTrigger>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Interns by Company-Department Chart/List */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0 h-100">
                            <Card.Header>
                                <h5 className="mb-0">Şirket-Departmana (Ekibe) Göre Stajyer Sayısı</h5>
                            </Card.Header>
                            <Card.Body>
                                {loadingInternCompanyDeptData ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Yükleniyor...</span>
                                        </Spinner>
                                    </div>
                                ) : internCompanyDeptData.length > 0 ? (
                                    <div
                                        className="d-flex flex-column gap-2 custom-scrollbar"
                                        style={{
                                            height: '300px',
                                            overflowY: 'auto',
                                            paddingRight: '4px',
                                            scrollbarWidth: 'thin'
                                        }}
                                    >
                                        {internCompanyDeptData.map((item, index) => (
                                            <OverlayTrigger
                                                key={index}
                                                trigger={['hover', 'focus']}
                                                placement="right"
                                                overlay={
                                                    <Popover id={`popover-interns-${index}`} style={{
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                                        background: '#ffffff',
                                                        padding: '12px',
                                                        minWidth: '220px',
                                                        maxWidth: '280px',
                                                        zIndex: 1060
                                                    }}>
                                                        <div className="d-flex align-items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#db2777' }}></div>
                                                            <span className="fw-semibold text-dark" style={{ fontSize: '12px' }}>{item.department_name} ({item.company_name})</span>
                                                        </div>
                                                        <div className="d-flex flex-column gap-1 custom-scrollbar" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px', scrollbarWidth: 'thin' }}>
                                                            {item.employee_names ? (
                                                                item.employee_names.split(', ').map((name, i) => (
                                                                    <div key={i} className="d-flex align-items-center gap-2 px-2 py-1 rounded" style={{
                                                                        background: '#f8fafc',
                                                                        fontSize: '11.5px',
                                                                        color: '#334155',
                                                                        fontWeight: 500
                                                                    }}>
                                                                        <i className="fe fe-user" style={{ fontSize: '11px', color: '#db2777' }}></i>
                                                                        <span>{name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-muted text-center py-2" style={{ fontSize: '11px' }}>Stajyer bilgisi bulunamadı</div>
                                                            )}
                                                        </div>
                                                    </Popover>
                                                }
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-between p-2 rounded-3"
                                                    style={{
                                                        background: 'rgba(248, 249, 250, 0.7)',
                                                        border: '1px solid rgba(0, 0, 0, 0.05)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(219, 39, 119, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                        e.currentTarget.style.background = 'rgba(248, 249, 250, 0.7)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                                                        <div
                                                            className="d-flex align-items-center justify-content-center rounded-circle"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                background: 'rgba(219, 39, 119, 0.1)',
                                                                color: '#db2777',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <i className="fe fe-book-open fs-5"></i>
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h6 className="mb-0 text-dark fw-semibold text-truncate" title={item.department_name}>
                                                                {item.department_name}
                                                            </h6>
                                                            <small className="text-muted d-block text-truncate" title={item.company_name}>
                                                                {item.company_name}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="d-flex align-items-center justify-content-center fw-bold rounded-pill"
                                                        style={{
                                                            minWidth: '28px',
                                                            height: '22px',
                                                            padding: '0 8px',
                                                            background: 'rgba(219, 39, 119, 0.15)',
                                                            color: '#db2777',
                                                            fontSize: '11px',
                                                            flexShrink: 0,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {item.count}
                                                    </div>
                                                </div>
                                            </OverlayTrigger>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Stajyer bulunamadı</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Gender Chart (Moved to third place) */}
                    <Col lg={4} md={12} xs={12} className="mb-6">
                        <Card className="border-0 h-100">
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
                                    (() => {
                                        const totalGenderCount = genderData.reduce((acc, curr) => acc + curr.count, 0);

                                        // Largest Remainder Method (Hare-Niemeyer) to ensure percentages sum to exactly 100%
                                        const raw = genderData.map(item => totalGenderCount > 0 ? (item.count / totalGenderCount) * 100 : 0);
                                        const floors = raw.map(val => Math.floor(val));
                                        const remainders = raw.map((val, idx) => ({ remainder: val - floors[idx], idx }));

                                        const sumFloors = floors.reduce((a, b) => a + b, 0);
                                        const diff = totalGenderCount > 0 ? 100 - sumFloors : 0;

                                        // Sort remainders descending to distribute the difference
                                        const sortedRemainders = [...remainders].sort((a, b) => b.remainder - a.remainder);
                                        for (let i = 0; i < diff; i++) {
                                            if (sortedRemainders[i]) {
                                                floors[sortedRemainders[i].idx] += 1;
                                            }
                                        }

                                        return (
                                            <div className="d-flex flex-column justify-content-between align-items-center h-100" style={{ minHeight: '300px' }}>
                                                <div className="position-relative" style={{ width: '100%', height: '220px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <defs>
                                                                <linearGradient id="genderMaleGrad" x1="0" y1="0" x2="1" y2="1">
                                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.95} />
                                                                </linearGradient>
                                                                <linearGradient id="genderFemaleGrad" x1="0" y1="0" x2="1" y2="1">
                                                                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.7} />
                                                                    <stop offset="100%" stopColor="#db2777" stopOpacity={0.95} />
                                                                </linearGradient>
                                                                <linearGradient id="genderOtherGrad" x1="0" y1="0" x2="1" y2="1">
                                                                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.7} />
                                                                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.95} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Pie
                                                                data={genderData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={65}
                                                                outerRadius={85}
                                                                paddingAngle={3}
                                                                cornerRadius={6}
                                                                dataKey="count"
                                                            >
                                                                {genderData.map((entry, index) => {
                                                                    const color = GENDER_COLORS[entry.gender] || COLORS[index % COLORS.length];
                                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                                })}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="position-absolute start-50 top-50 translate-middle text-center" style={{ pointerEvents: 'none' }}>
                                                        <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>{totalGenderCount}</h2>
                                                        <span className="text-muted fw-semibold" style={{ fontSize: '12.5px' }}>Çalışan</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-column align-items-start gap-2 mt-2" style={{ width: 'fit-content' }}>
                                                    {genderData.map((entry, index) => {
                                                        const legendColor = GENDER_LEGEND_COLORS[entry.gender] || COLORS[index % COLORS.length];
                                                        const pct = floors[index];
                                                        return (
                                                            <div key={index} className="d-flex align-items-center gap-2">
                                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: legendColor, flexShrink: 0 }}></div>
                                                                <span className="text-muted fw-semibold" style={{ fontSize: '13.5px' }}>
                                                                    {entry.gender}: <strong className="text-dark">{entry.count} ({pct}%)</strong>
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                        <span className="text-muted">Veri bulunamadı</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* EventsWidget already rendered above; removed duplicate to avoid double API calls */}

                <Row>
                    <Col lg={12} md={12} xs={12} className="mb-6">
                        <Card className="border-0 shadow-sm" style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            borderRadius: '16px'
                        }}>
                            <Card.Body className="p-4 p-md-5">
                                <div className="mb-4">
                                    <h2 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.5px' }}>Kartezya HR Yönetim Sistemine Hoşgeldiniz</h2>
                                    <p className="text-muted fs-6 mb-0" style={{ maxWidth: '800px', lineHeight: '1.6' }}>
                                        Bu sistem ile çalışanlarınızı, departmanlarınızı, izin süreçlerinizi, masraflarınızı ve etkinliklerinizi kolayca yönetebilirsiniz.
                                    </p>
                                </div>

                                <div className="row g-4 mt-2 row-cols-1 row-cols-md-3 row-cols-lg-6">
                                    {[
                                        {
                                            title: "Çalışan Yönetimi",
                                            desc: "Çalışan bilgilerini ekleyin, düzenleyin ve yönetin.",
                                            icon: "fe-users",
                                            bg: "rgba(13, 110, 253, 0.08)",
                                            color: "#0d6efd"
                                        },
                                        {
                                            title: "İzin Yönetimi",
                                            desc: "İzin taleplerini onaylayın ve raporlayın.",
                                            icon: "fe-calendar",
                                            bg: "rgba(111, 66, 193, 0.08)",
                                            color: "#6f42c1"
                                        },
                                        {
                                            title: "Masraf Yönetimi",
                                            desc: "Çalışan masraf taleplerini değerlendirin ve ödemeleri takip edin.",
                                            icon: "fe-credit-card",
                                            bg: "rgba(253, 126, 20, 0.08)",
                                            color: "#fd7e14"
                                        },
                                        {
                                            title: "Etkinlik Yönetimi",
                                            desc: "Etkinlikleri planlayın, duyurun ve katılım süreçlerini yönetin.",
                                            icon: "fe-award",
                                            bg: "rgba(220, 53, 69, 0.08)",
                                            color: "#dc3545"
                                        },
                                        {
                                            title: "Döküman Yönetimi",
                                            desc: "Önemli evrakları ve belgeleri güvenli bir şekilde depolayın ve paylaşın.",
                                            icon: "fe-file-text",
                                            bg: "rgba(25, 135, 84, 0.08)",
                                            color: "#198754"
                                        },
                                        {
                                            title: "Bildirim Yönetimi",
                                            desc: "Tüm sisteme veya gruplara duyuru ve anlık bildirimler gönderin.",
                                            icon: "fe-bell",
                                            bg: "rgba(13, 202, 240, 0.08)",
                                            color: "#0dcaf0"
                                        }
                                    ].map((feat, idx) => (
                                        <div key={idx} className="col">
                                            <div
                                                className="p-4 rounded-4 h-100 d-flex flex-column gap-3"
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid rgba(0, 0, 0, 0.05)',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                                    e.currentTarget.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.06)';
                                                    e.currentTarget.style.borderColor = feat.color + '44'; // 25% opacity
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                }}
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3"
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        background: feat.bg,
                                                        color: feat.color,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <i className={`fe ${feat.icon} fs-4`}></i>
                                                </div>
                                                <div>
                                                    <h5 className="fw-semibold text-dark mb-2" style={{ fontSize: '15px' }}>{feat.title}</h5>
                                                    <p className="text-muted mb-0 small" style={{ lineHeight: '1.5' }}>{feat.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
