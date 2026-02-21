"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Spinner, Row, Col, Card, Button, Nav, Tab, Form, Table } from 'react-bootstrap';
import { employeeService, workInformationService, employeeGradeService, lookupService } from '@/services';
import { Employee, EmployeeWorkInformation } from '@/models/hr/common.types';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { Edit, Trash2, Save, X } from 'react-feather';
import EmployeeHeaderProfile from '@/components/employee-detail/EmployeeHeaderProfile';
import WorkInformationModal from '@/components/modals/WorkInformationModal';
import EmployeeGradeModal from '@/components/modals/EmployeeGradeModal';
import DeleteModal from '@/components/DeleteModal';
import styles from './page.module.scss';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions, statusOptions } from '@/contants/options';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import { GradeLookup } from '@/services/lookup.service';
import FormTextField from '@/components/FormTextField';
import { UserRole } from '@/models/enums/hr.enum';
import LoadingOverlay from '@/components/LoadingOverlay';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const EmployeeDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workInformations, setWorkInformations] = useState<EmployeeWorkInformation[]>([]);
  const [employeeGrades, setEmployeeGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkInfoModal, setShowWorkInfoModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isWorkInfoEdit, setIsWorkInfoEdit] = useState(false);
  const [isGradeEdit, setIsGradeEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedWorkInfo, setSelectedWorkInfo] = useState<EmployeeWorkInformation | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<any | null>(null);
  const [workInfoToDelete, setWorkInfoToDelete] = useState<EmployeeWorkInformation | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<any | null>(null);
  const [grades, setGrades] = useState<GradeLookup[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<string[]>(['EMPLOYEE']);
  const [deleteItemType, setDeleteItemType] = useState<'workinfo' | 'grade' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    identity_no: '',
    nationality: '',
    mother_name: '',
    father_name: '',
    hire_date: '',
    leave_date: '',
    profession_start_date: '',
    is_grade_up: false,
    status: '',
    note: '',
    emergency_contact_name: '',
    emergency_contact: '',
    emergency_contact_relation: '',
  });

  // Helper function to get display value for enum
  const getEnumDisplayValue = (enumValue: string, options: any[]): string => {
    if (!enumValue) return '-';
    const option = options.find(opt => opt.value === enumValue);
    return option ? option.label : enumValue;
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  useEffect(() => {
    // Fetch grades when component mounts
    fetchGrades();
  }, []);

  useEffect(() => {
    // Rol bilgisini employee state'inden al
    if (employee && (employee as any).roles) {
      setRoles((employee as any).roles);
    }
  }, [employee]);

  const fetchGrades = async () => {
    try {
      const response = await lookupService.getGradesLookup();
      if (response.success && response.data) {
        setGrades(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getById(parseInt(employeeId));

      if (response?.data) {
        setEmployee(response.data);
        // Fetch work informations for this employee
        fetchWorkInformations(response.data.id);
        // Fetch employee grades
        fetchEmployeeGrades(response.data.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
      router.push('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkInformations = async (empId: number) => {
    try {
      const response = await workInformationService.getByEmployeeId(empId);

      if (response?.data) {
        let allWorkInfos: any[] = [];

        // Check if response.data is paginated or direct array
        if ((response.data as any).items && Array.isArray((response.data as any).items)) {
          // Paginated response
          allWorkInfos = (response.data as any).items;
        } else if (Array.isArray(response.data)) {
          // Direct array response
          allWorkInfos = response.data as any[];
        }

        // Sort by start_date descending (en yeni en üstte)
        const sorted = allWorkInfos.sort((a: any, b: any) => {
          const dateA = new Date(a.start_date || 0).getTime();
          const dateB = new Date(b.start_date || 0).getTime();
          return dateB - dateA;
        });

        setWorkInformations(sorted as EmployeeWorkInformation[]);
      } else {
        setWorkInformations([]);
      }
    } catch (error) {
      setWorkInformations([]);
    }
  };

  const fetchEmployeeGrades = async (empId: number) => {
    try {
      const response = await employeeGradeService.getByEmployeeId(empId);

      if (response?.data) {
        let allGrades: any[] = [];

        // Check if response.data is paginated or direct array
        if ((response.data as any).items && Array.isArray((response.data as any).items)) {
          // Paginated response
          allGrades = (response.data as any).items;
        } else if (Array.isArray(response.data)) {
          // Direct array response
          allGrades = response.data as any[];
        }

        // Sort by start_date descending (en yeni en üstte)
        const sorted = allGrades.sort((a: any, b: any) => {
          const dateA = new Date(a.start_date || 0).getTime();
          const dateB = new Date(b.start_date || 0).getTime();
          return dateB - dateA;
        });

        setEmployeeGrades(sorted);
      } else {
        setEmployeeGrades([]);
      }
    } catch (error) {
      setEmployeeGrades([]);
    }
  };

  const handleDeleteWorkInfo = async () => {
    if (!workInfoToDelete) return;

    setIsDeleting(true);
    try {
      await workInformationService.delete(workInfoToDelete.id);
      toast.success('İş bilgisi başarıyla silindi');
      setShowDeleteModal(false);
      setWorkInfoToDelete(null);
      if (employee) {
        fetchWorkInformations(employee.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Silme işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!gradeToDelete) return;

    setIsDeleting(true);
    try {
      await employeeGradeService.delete(gradeToDelete.id);
      toast.success('Grade bilgisi başarıyla silindi');
      setShowDeleteModal(false);
      setGradeToDelete(null);
      if (employee) {
        fetchEmployeeGrades(employee.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Silme işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setRoles(prev => {
      const newRoles = prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role];
      return newRoles;
    });
  };

  const handleSaveEmployee = async () => {
    if (!employee) return;

    setIsSaving(true);
    try {
      const submitData: any = {
        email: employee.email.trim(),
        company_email: (employee.company_email || '').trim(),
        first_name: employee.first_name.trim(),
        last_name: employee.last_name.trim(),
        phone: (employee.phone || '').trim(),
        address: (employee.address || '').trim(),
        state: (employee.state || '').trim(),
        city: (employee.city || '').trim(),
        gender: employee.gender || undefined,
        date_of_birth: employee.date_of_birth || undefined,
        hire_date: employee.hire_date,
        leave_date: employee.leave_date || undefined,
        marital_status: employee.marital_status || undefined,
        emergency_contact: (employee.emergency_contact || '').trim(),
        emergency_contact_name: (employee.emergency_contact_name || '').trim(),
        emergency_contact_relation: employee.emergency_contact_relation || undefined,
        profession_start_date: (employee as any).profession_start_date || undefined,
        note: ((employee as any).note || '').trim(),
        mother_name: ((employee as any).mother_name || '').trim(),
        father_name: ((employee as any).father_name || '').trim(),
        nationality: ((employee as any).nationality || '').trim(),
        identity_no: ((employee as any).identity_no || '').trim(),
        roles: roles,
        status: employee.status
      };

      await employeeService.update(employee.id, submitData);
      toast.success('Çalışan başarıyla güncellendi');
      fetchEmployeeDetails();
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Bir hata oluştu';
      }
      
      const translatedError = translateErrorMessage(errorMessage);
      toast.error(translatedError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={styles.notFoundContainer}>
        <h5>Çalışan bulunamadı</h5>
        <button
          className={styles.backButton}
          onClick={() => router.push('/employees')}
        >
          Çalışanlara Dön
        </button>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const calculateExperienceFromProfessionStartDate = (startDate: string | undefined | null, totalGap: number = 0): string => {
    if (!startDate) return '-';

    try {
      const start = new Date(startDate);
      const today = new Date();

      let years = today.getFullYear() - start.getFullYear();
      const monthDiff = today.getMonth() - start.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
        years--;
      }

      // Calculate months difference
      let months = monthDiff;
      if (months < 0) {
        months += 12;
      }

      // Subtract total_gap (in years) from the calculated experience
      const gapYears = Math.floor(totalGap);
      const gapMonths = Math.round((totalGap - gapYears) * 12);

      years -= gapYears;
      months -= gapMonths;

      // Adjust if months is negative
      if (months < 0) {
        years--;
        months += 12;
      }

      // Ensure years is not negative
      if (years < 0) {
        return '-';
      }

      // Format as "X yıl Y ay"
      if (years === 0 && months === 0) {
        return '-';
      } else if (years === 0) {
        return `${months} ay`;
      } else if (months === 0) {
        return `${years} yıl`;
      } else {
        return `${years} yıl ${months} ay`;
      }
    } catch (error) {
      return '-';
    }
  };

  const getDisplayExperience = (): string => {
    // Calculate from profession_start_date with total_gap subtraction
    const totalGap = (employee as any)?.total_gap || 0;
    const professionStartDate = (employee as any)?.profession_start_date;

    if (professionStartDate) {
      return calculateExperienceFromProfessionStartDate(professionStartDate, totalGap);
    }

    return '-';
  };

  // Map the status to match the expected values for EmployeeStatusBadge
  const mapStatusToBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "PASSIVE":
        return "inactive";
      default:
        return "warning"; // Default to warning for unknown statuses
    }
  };

  return (
    <Container fluid className="page-container">
      <div style={{ display: 'none' }} className="d-none d-lg-block">
      </div>

      <div className={styles.mainContent}>
        <Container fluid>
          <EmployeeHeaderProfile
            employee={{
              name: `${employee.first_name} ${employee.last_name}`,
              jobTitle: workInformations.length > 0 ? (workInformations[0].job_position?.title || '-') : (employee.work_information?.job_title || '-'),
              initials: getInitials(employee.first_name, employee.last_name),
              company: workInformations.length > 0 ? (workInformations[0].company?.name || '-') : (employee.work_information?.company_name || '-'),
              department: workInformations.length > 0 ? (workInformations[0].department?.name || '-') : (employee.work_information?.department_name || '-'),
              manager: workInformations.length > 0 ? (workInformations[0].department?.manager || '-') : (employee.work_information?.manager || '-'),
              email: employee.email,
              phone: employee.phone || '-',
              address: employee.address || '-',
            }}
          />

          <div className="d-lg-none mb-4 pt-3">
            <h3 className="mb-0">{employee.first_name} {employee.last_name}</h3>
            <p className="text-muted mb-0">{workInformations.length > 0 ? (workInformations[0].job_position?.title) : (employee.work_information?.job_title)}</p>
          </div>

          <Tab.Container id="employee-tabs" defaultActiveKey="employee-info">
            <Card className="border-0 shadow-sm">
              <Card.Header className="border-bottom-0 bg-transparent">
                <Nav 
                  variant="tabs" 
                  className="custom-nav-tabs"
                  style={{
                    display: 'flex',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    flexWrap: 'nowrap',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <Nav.Item style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Nav.Link 
                      eventKey="employee-info"
                    >
                      Çalışan Bilgileri
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Nav.Link 
                      eventKey="work-info"
                    >
                      İş Bilgileri
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Nav.Link 
                      eventKey="document-info"
                    >
                      Doküman Bilgileri
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Nav.Link 
                      eventKey="grade-info"
                    >
                      Grade Bilgileri
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Nav.Link 
                      eventKey="contract-info"
                    >
                      Sözleşme Bilgileri
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>
                <Tab.Content>
                  {/* Çalışan Bilgileri Tab */}
                  <Tab.Pane eventKey="employee-info">
                    <div className="mb-4">
                      <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', margin: '1.5rem 0' }}>Kişisel Bilgiler</h6>
                      <Row>
                        <Col md={4}>
                          <FormTextField
                            controlId="firstName"
                            label="Ad"
                            name="first_name"
                            value={employee.first_name}
                            onChange={(name, value) => setEmployee({ ...employee, first_name: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="lastName"
                            label="Soyad"
                            name="last_name"
                            value={employee.last_name}
                            onChange={(name, value) => setEmployee({ ...employee, last_name: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="identityNo"
                            label="Kimlik No"
                            name="identity_no"
                            value={(employee as any).identity_no || ''}
                            onChange={(name, value) => setEmployee({ ...employee, identity_no: value } as any)}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <FormDateField
                            label="Doğum Tarihi"
                            name="date_of_birth"
                            value={employee.date_of_birth ? employee.date_of_birth.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, date_of_birth: e.target.value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormSelectField
                            name="gender"
                            label="Cinsiyet"
                            value={employee.gender || ''}
                            onChange={(e) => setEmployee({ ...employee, gender: e.target.value })}
                          >
                            <option value="">Cinsiyet seçiniz</option>
                            {genderOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Col>
                        <Col md={4}>
                          <FormSelectField
                            name="marital_status"
                            label="Medeni Durum"
                            value={employee.marital_status || ''}
                            onChange={(e) => setEmployee({ ...employee, marital_status: e.target.value })}
                          >
                            <option value="">Medeni durum seçiniz</option>
                            {maritalStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>

                          <FormTextField
                            controlId="motherName"
                            label="Anne Adı"
                            name="mother_name"
                            value={(employee as any).mother_name || ''}
                            onChange={(name, value) => setEmployee({ ...employee, mother_name: value } as any)}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="fatherName"
                            label="Baba Adı"
                            name="father_name"
                            value={(employee as any).father_name || ''}
                            onChange={(name, value) => setEmployee({ ...employee, father_name: value } as any)}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="nationality"
                            label="Uyruk"
                            name="nationality"
                            value={(employee as any).nationality || ''}
                            onChange={(name, value) => setEmployee({ ...employee, nationality: value } as any)}
                          />
                        </Col>
                      </Row>
                    </div>

                    <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />

                    <div className="mb-4">
                      <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>İletişim Bilgileri</h6>
                      <Row>
                        <Col md={4}>
                          <FormTextField
                            controlId="email"
                            label="Kişisel E-posta"
                            name="email"
                            type="email"
                            value={employee.email}
                            onChange={(name, value) => setEmployee({ ...employee, email: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="companyEmail"
                            label="Şirket E-posta"
                            name="company_email"
                            type="email"
                            value={employee.company_email || ''}
                            onChange={(name, value) => setEmployee({ ...employee, company_email: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="phone"
                            label="Telefon No"
                            name="phone"
                            value={employee.phone || ''}
                            onChange={(name, value) => setEmployee({ ...employee, phone: value })}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <FormTextField
                            controlId="city"
                            label="İl"
                            name="city"
                            value={employee.city || ''}
                            onChange={(name, value) => setEmployee({ ...employee, city: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="state"
                            label="İlçe"
                            name="state"
                            value={employee.state || ''}
                            onChange={(name, value) => setEmployee({ ...employee, state: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="address"
                            label="Açık Adres"
                            name="address"
                            value={employee.address || ''}
                            onChange={(name, value) => setEmployee({ ...employee, address: value })}
                            rows={2}
                          />
                        </Col>
                      </Row>
                    </div>

                    <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />

                    <div className="mb-4">
                      <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>İstihdam Bilgileri</h6>
                      <Row>
                        <Col md={4}>
                          <FormDateField
                            label="Meslek Başlama Tarihi"
                            name="profession_start_date"
                            value={(employee as any).profession_start_date ? (employee as any).profession_start_date.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, profession_start_date: e.target.value } as any)}
                          />
                        </Col>
                        <Col md={4}>
                          <FormDateField
                            label="İşe Başlama Tarihi"
                            name="hire_date"
                            value={employee.hire_date ? employee.hire_date.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, hire_date: e.target.value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormDateField
                            label="İşten Ayrılma Tarihi"
                            name="leave_date"
                            value={employee.leave_date ? employee.leave_date.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, leave_date: e.target.value })}
                          />
                        </Col>
                      </Row>
                      <Row>
                      <Col md={4}>
                          <FormSelectField
                            name="status"
                            label="Statü"
                            value={employee.status || ''}
                            onChange={(e) => setEmployee({ ...employee, status: e.target.value as "ACTIVE" | "PASSIVE" | undefined })}
                          >
                            <option value="">Statü seçiniz</option>
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <Form.Group controlId="isGradeUp">
                              <Form.Label>Grade Yükseltildi</Form.Label>
                              <Form.Check
                                type="switch"
                                id="isGradeUp"
                                label={(employee as any).is_grade_up ? 'Evet' : 'Hayır'}
                                checked={(employee as any).is_grade_up}
                                onChange={(e) => setEmployee({ ...employee, is_grade_up: e.target.checked } as any)}
                              />
                            </Form.Group>
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <FormTextField
                            controlId="note"
                            label="Not"
                            name="note"
                            value={(employee as any).note || ''}
                            onChange={(name, value) => setEmployee({ ...employee, note: value } as any)}
                            type="textarea"
                            rows={4}
                            placeholder="Not giriniz"
                          />
                        </Col>
                      </Row>
                    </div>

                    <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />

                    <div>
                      <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Acil Durum İletişim</h6>
                      <Row>
                        <Col md={4}>
                          <FormTextField
                            controlId="emergencyContactName"
                            label="Ad Soyad"
                            name="emergency_contact_name"
                            value={employee.emergency_contact_name || ''}
                            onChange={(name, value) => setEmployee({ ...employee, emergency_contact_name: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="emergencyContact"
                            label="Telefon No"
                            name="emergency_contact"
                            value={employee.emergency_contact || ''}
                            onChange={(name, value) => setEmployee({ ...employee, emergency_contact: value })}
                          />
                        </Col>
                        <Col md={4}>
                          <FormSelectField
                            name="emergency_contact_relation"
                            label="İlişki"
                            value={employee.emergency_contact_relation || ''}
                            onChange={(e) => setEmployee({ ...employee, emergency_contact_relation: e.target.value })}
                          >
                            <option value="">İlişki seçiniz</option>
                            {emergencyContactRelationOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Col>
                      </Row>
                    </div>
                    
                    <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />

                    {/* Roles */}
                    <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Rol Bilgileri</h6>
                                
                    <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      {Object.values(UserRole).map(role => (
                        <Form.Check
                          key={role}
                          type="checkbox"
                          id={`role-${role}`}
                          label={role}
                          checked={roles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                          className="mb-2"
                        />
                      ))}
                    </div>

                    <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <Button 
                        variant="primary" 
                        onClick={handleSaveEmployee}
                        disabled={isSaving}
                        className="d-flex align-items-center"
                      >
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>

                    <LoadingOverlay show={isSaving} message="Kaydediliyor..." />

                  </Tab.Pane>

                  {/* İş Bilgileri Tab */}
                  <Tab.Pane eventKey="work-info">
                    <div className={styles.section}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <Button
                          className="d-flex align-items-center"
                          variant="primary"
                          onClick={() => {
                            setSelectedWorkInfo(null);
                            setIsWorkInfoEdit(false);
                            setShowWorkInfoModal(true);
                          }}
                        >
                          <i className="fe fe-plus"></i>
                          <span className="d-none d-lg-flex ms-2">Yeni İş Bilgisi</span>
                        </Button>
                      </div>

                      {workInformations.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th>Şirket</th>
                              <th>Departman</th>
                              <th>Yönetici</th>
                              <th>Başlama Tarihi</th>
                              <th>Bitiş Tarihi</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {workInformations.map((workInfo) => (
                              <tr key={workInfo.id}>
                                <td>{workInfo.company?.name || '-'}</td>
                                <td>{workInfo.department?.name || '-'}</td>
                                <td>{workInfo.department?.manager || '-'}</td>
                                <td>{workInfo.start_date ? formatDate(workInfo.start_date) : '-'}</td>
                                <td>{workInfo.end_date ? formatDate(workInfo.end_date) : '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedWorkInfo(workInfo);
                                        setIsWorkInfoEdit(true);
                                        setShowWorkInfoModal(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => {
                                        setWorkInfoToDelete(workInfo);
                                        setShowDeleteModal(true);
                                      }}
                                      title="Sil"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">İş bilgisi kaydı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Tab.Pane>

                  {/* Doküman Bilgileri Tab */}
                  <Tab.Pane eventKey="document-info">
                    <div className={styles.section}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="py-5 text-center">
                          <p className="text-muted mb-0">Doküman bilgisi kaydı bulunamadı</p>
                        </Card.Body>
                      </Card>
                    </div>
                  </Tab.Pane>

                  {/* Grade Bilgileri Tab */}
                  <Tab.Pane eventKey="grade-info">
                    <div className={styles.section}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <Button
                          className="d-flex align-items-center"
                          variant="primary"
                          onClick={() => {
                            setSelectedGrade(null);
                            setIsGradeEdit(false);
                            setShowGradeModal(true);
                          }}
                        >
                          <i className="fe fe-plus"></i>
                          <span className="d-none d-lg-flex ms-2">Yeni Grade Bilgisi</span>
                        </Button>
                      </div>

                      {employeeGrades.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th>Grade</th>
                              <th>Başlama Tarihi</th>
                              <th>Bitiş Tarihi</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeGrades.map((grade) => (
                              <tr key={grade.id}>
                                <td>{grade.grade?.name || '-'}</td>
                                <td>{grade.start_date ? formatDate(grade.start_date) : '-'}</td>
                                <td>{grade.end_date ? formatDate(grade.end_date) : '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedGrade(grade);
                                        setIsGradeEdit(true);
                                        setShowGradeModal(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => {
                                        setGradeToDelete(grade);
                                        setDeleteItemType('grade');
                                        setShowDeleteModal(true);
                                      }}
                                      title="Sil"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">Grade bilgisi kaydı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Tab.Pane>

                  {/* Sözleşme Bilgileri Tab */}
                  <Tab.Pane eventKey="contract-info">
                    <div className={styles.section}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="py-5 text-center">
                          <p className="text-muted mb-0">Sözleşme bilgisi kaydı bulunamadı</p>
                        </Card.Body>
                      </Card>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Container>
      </div>

      <WorkInformationModal
        show={showWorkInfoModal}
        onHide={() => {
          setShowWorkInfoModal(false);
          setSelectedWorkInfo(null);
          setIsWorkInfoEdit(false);
        }}
        onSave={() => {
          setShowWorkInfoModal(false);
          setSelectedWorkInfo(null);
          setIsWorkInfoEdit(false);
          if (employee) {
            fetchWorkInformations(employee.id);
          }
        }}
        employeeId={employee?.id || parseInt(employeeId)}
        workInformation={selectedWorkInfo}
        isEdit={isWorkInfoEdit}
      />

      <EmployeeGradeModal
        show={showGradeModal}
        onHide={() => {
          setShowGradeModal(false);
          setSelectedGrade(null);
          setIsGradeEdit(false);
        }}
        onSave={() => {
          setShowGradeModal(false);
          setSelectedGrade(null);
          setIsGradeEdit(false);
          if (employee) {
            fetchEmployeeGrades(employee.id);
          }
        }}
        employeeId={employee?.id || parseInt(employeeId)}
        employeeGrade={selectedGrade}
        isEdit={isGradeEdit}
      />

      {showDeleteModal && deleteItemType === 'workinfo' && (
        <DeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setWorkInfoToDelete(null);
          }}
          onHandleDelete={handleDeleteWorkInfo}
          loading={isDeleting}
          title="İş Bilgisi Sil"
          message="İş bilgisini silmek istediğinize emin misiniz?"
        />
      )}

      {showDeleteModal && deleteItemType === 'grade' && (
        <DeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setGradeToDelete(null);
          }}
          onHandleDelete={handleDeleteGrade}
          loading={isDeleting}
          title="Grade Bilgisi Sil"
          message="Grade bilgisini silmek istediğinize emin misiniz?"
        />
      )}
    </Container>
  );
};

export default EmployeeDetailPage;
