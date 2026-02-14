"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Spinner, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { employeeService, workInformationService } from '@/services';
import { Employee, EmployeeWorkInformation } from '@/models/hr/common.types';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { Edit, Trash2 } from 'react-feather';
import LeftProfileColumn from '@/components/employee-detail/LeftProfileColumn';
import EmployeeModal from '@/components/modals/EmployeeModal';
import WorkInformationModal from '@/components/modals/WorkInformationModal';
import DeleteModal from '@/components/DeleteModal';
import styles from './page.module.scss';
import { genderOptions, maritalStatusOptions, emergencyContactRelationOptions, statusOptions } from '@/contants/options';
import EmployeeStatusBadge from '@/components/StatusBadge';

const EmployeeDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workInformations, setWorkInformations] = useState<EmployeeWorkInformation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWorkInfoModal, setShowWorkInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isWorkInfoEdit, setIsWorkInfoEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedWorkInfo, setSelectedWorkInfo] = useState<EmployeeWorkInformation | null>(null);
  const [workInfoToDelete, setWorkInfoToDelete] = useState<EmployeeWorkInformation | null>(null);

  // Helper function to get display value for enum
  const getEnumDisplayValue = (enumValue: string, options: any[]): string => {
    if (!enumValue) return '-';
    const option = options.find(opt => opt.value === enumValue);
    return option ? option.label : enumValue;
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getById(parseInt(employeeId));
      
      if (response?.data) {
        setEmployee(response.data);
        // Fetch work informations for this employee
        fetchWorkInformations(response.data.id);
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

  const handleEditEmployee = () => {
    setSelectedEmployee(employee);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleModalSave = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setIsEdit(false);
    fetchEmployeeDetails();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setIsEdit(false);
  };

  const handleDeleteWorkInfo = async () => {
    if (!workInfoToDelete) return;

    setIsDeleting(true);
    try {
      await workInformationService.deleteWorkInformation(workInfoToDelete.id);
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
    <div className={styles.pageContainer}>
      <div style={{ display: 'none' }} className="d-none d-lg-block">
        <LeftProfileColumn 
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
      </div>

      <div className={styles.mainContent}>
        <Container fluid className={styles.contentWrapper}>
          <div className="d-lg-none mb-4 pt-3">
            <h3 className="mb-0">{employee.first_name} {employee.last_name}</h3>
            <p className="text-muted mb-0">{employee.work_information?.job_title || '-'}</p>
          </div>

          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.sectionTitle}>Çalışan Bilgileri</h2>
              <button
                onClick={handleEditEmployee}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem',
                  color: '#6366f1',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Edit size={20} />
              </button>
            </div>
            <div className={styles.cardGrid}>
              <Card className="border-0 shadow-sm" style={{ gridColumn: '1 / -1' }}>
                <Card.Body>
                  <div className="mb-4">
                    <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Kişisel Bilgiler</h6>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AD SOYAD</label>
                          <p className="mb-2">{employee.first_name} {employee.last_name}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>DOĞUM TARİHİ</label>
                          <p className="mb-2">{employee.date_of_birth ? formatDate(employee.date_of_birth) : '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>CİNSİYET</label>
                          <p className="mb-2">{getEnumDisplayValue((employee as any).gender, genderOptions)}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>KİMLİK NO</label>
                          <p className="mb-0">{(employee as any).identity_no || '-'}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>MEDENİ DURUM</label>
                          <p className="mb-2">{getEnumDisplayValue((employee as any).marital_status, maritalStatusOptions)}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>TOPLAM DENEYİM</label>
                          <p className="mb-2">{getDisplayExperience()}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>UYRUK</label>
                          <p className="mb-2">{(employee as any).nationality || '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ANNE ADI</label>
                          <p className="mb-0">{(employee as any).mother_name || '-'}</p>
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>BABA ADI</label>
                          <p className="mb-0">{(employee as any).father_name || '-'}</p>
                        </div>
                      </Col>
                    </Row>
                
                  </div>

                  <hr style={{ margin: '1.5rem 0', borderColor: '#e9ecef' }} />

                  <div className="mb-4">
                    <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>İletişim Bilgileri</h6>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>E-POSTA</label>
                          <p className="mb-2">{employee.email}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ŞİRKET E-POSTA</label>
                          <p className="mb-2">{employee.company_email || '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>TELEFON NO</label>
                          <p className="mb-0">{employee.phone || '-'}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ADRES</label>
                          <p className="mb-2">{employee.address || '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>İL</label>
                          <p className="mb-2">{employee.city || '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>İLÇE</label>
                          <p className="mb-0">{employee.state || '-'}</p>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <hr style={{ margin: '1.5rem 0', borderColor: '#e9ecef' }} />

                  <div className="mb-4">
                    <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>İstihdam & Sözleşme Bilgileri</h6>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>İŞE BAŞLAMA TARİHİ</label>
                          <p className="mb-2">{employee.hire_date ? formatDate(employee.hire_date) : '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>İŞTEN AYRILMA TARİHİ</label>
                          <p className="mb-2">{employee.leave_date ? formatDate(employee.leave_date) : '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>TOPLAM DENEYİM</label>
                          <p className="mb-2">{getDisplayExperience()}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>MESLEĞE BAŞLAMA TARİHİ</label>
                          <p className="mb-0">{(employee as any).profession_start_date ? formatDate((employee as any).profession_start_date) : '-'}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SÖZLEŞME NO</label>
                          <p className="mb-2">{(employee as any).contract_no || '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>GRADE</label>
                          <p className="mb-2">{(employee as any).grade_id ? `Grade ${(employee as any).grade_id}` : '-'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>GRADE YÜKSELTİLECEK Mİ</label>
                          <p className="mb-3">
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              backgroundColor: (employee as any).is_grade_up ? '#d1fae5' : '#f3f4f6',
                              color: (employee as any).is_grade_up ? '#065f46' : '#6b7280'
                            }}>
                              {(employee as any).is_grade_up ? 'Evet' : 'Hayır'}
                            </span>
                          </p>
                        </div>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>STATÜ</label>
                          <EmployeeStatusBadge status={mapStatusToBadge(employee.status || "UNKNOWN")} />
                        </div>
                       
                        {(employee as any).note && (
                          <div className="mb-3">
                            <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>NOT</label>
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{(employee as any).note}</p>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>

                  <hr style={{ margin: '1.5rem 0', borderColor: '#e9ecef' }} />

                  <div>
                    <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Acil Durum İletişim</h6>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AD SOYAD</label>
                          <p className="mb-0">{employee.emergency_contact_name || '-'}</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>TELEFON NO</label>
                          <p className="mb-0">{employee.emergency_contact || '-'}</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <label className="d-block" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>İLİŞKİSİ</label>
                          <p className="mb-0">{getEnumDisplayValue(employee.emergency_contact_relation || '', emergencyContactRelationOptions)}</p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.sectionTitle}>İş Bilgileri</h2>
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
              <Row className="g-3">
                {workInformations.map((workInfo) => (
                  <Col xs={12} key={workInfo.id}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: '1px solid #e9ecef' }}>
                          <div>
                            <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '15px', marginBottom: '0.25rem' }}>
                              {workInfo.company?.name || '-'}
                            </h6>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: 0 }}>
                              {workInfo.department?.name || '-'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Yönetici</label>
                            <p style={{ fontSize: '13px', color: '#374151', marginBottom: 0 }}>{workInfo.department?.manager || '-'}</p>
                          </div>
                        </div>

                        <Row className="g-3" style={{ marginTop: '1.5rem' }}>
                          <Col md={6}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>BAŞLAMA TARİHİ</label>
                            <p style={{ fontSize: '13px', color: '#374151', marginBottom: 0 }}>{workInfo.start_date ? formatDate(workInfo.start_date) : '-'}</p>
                          </Col>

                          <Col md={6}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>BİTİŞ TARİHİ</label>
                            <p style={{ fontSize: '13px', color: '#374151', marginBottom: 0 }}>{workInfo.end_date ? formatDate(workInfo.end_date) : '-'}</p>
                          </Col>
                        </Row>

                        <Row className="g-3" style={{ marginTop: '0.5rem' }}>
                          <Col md={6}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>SİCİL NO</label>
                            <p style={{ fontSize: '13px', color: '#374151', marginBottom: 0 }}>{workInfo.personnel_no || (workInfo as any).personnelNo || '-'}</p>
                          </Col>

                          <Col md={6}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>İŞ E-POSTASI</label>
                            <p style={{ fontSize: '13px', color: '#374151', marginBottom: 0 }}>{workInfo.work_email || (workInfo as any).workEmail || '-'}</p>
                          </Col>
                        </Row>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
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
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Card className="border-0 shadow-sm">
                <Card.Body className="py-5 text-center">
                  <p className="text-muted mb-0">İş bilgisi kaydı bulunamadı</p>
                </Card.Body>
              </Card>
            )}
          </div>
        </Container>
      </div>

      <EmployeeModal
        show={showModal}
        onHide={handleModalClose}
        onSave={handleModalSave}
        employee={selectedEmployee}
        isEdit={isEdit}
      />

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

      {showDeleteModal && (
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
    </div>
  );
};

export default EmployeeDetailPage;
