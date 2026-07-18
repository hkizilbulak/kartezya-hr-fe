"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Spinner, Row, Col, Card, Button, Nav, Tab, Form, Table } from 'react-bootstrap';
import { employeeService, workInformationService, employeeGradeService, employeeContractService, lookupService } from '@/services';
import { Employee, EmployeeWorkInformation } from '@/models/hr/hr-models';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { Edit, Trash2, Download, Upload, ChevronUp, ChevronDown, User, FileText, Briefcase, Folder, Award, Clipboard, Shield, Calendar, DollarSign } from 'react-feather';
import EmployeeHeaderProfile from '@/components/employee-detail/EmployeeHeaderProfile';
import WorkInformationModal from '@/components/modals/WorkInformationModal';
import EmployeeGradeModal from '@/components/modals/EmployeeGradeModal';
import EmployeeContractModal from '@/components/modals/EmployeeContractModal';
import EmployeeLeaveRequests from '@/components/leave/EmployeeLeaveRequests';
import EmployeeExpenseRequests from '@/components/expense/EmployeeExpenseRequests';
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
import { documentService } from '@/services/document.service';
import { ATTACHMENT_RELATED_TYPE_EMPLOYEE, ATTACHMENT_TYPE_CV } from '@/services/document.service';
import axiosInstance from '@/helpers/api/axiosInstance';
import CustomPagination from '@/components/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { Capability, hasCapability } from '@/lib/authz/capabilities';

const EmployeeDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const { user } = useAuth();
  const canManageEmployees = hasCapability(user?.roles, Capability.CanManageEmployees);
  const isActorAdmin = !!user?.roles?.includes(UserRole.ADMIN);
  const isActorHR = !isActorAdmin && !!user?.roles?.includes(UserRole.HR);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workInformations, setWorkInformations] = useState<EmployeeWorkInformation[]>([]);
  const [employeeGrades, setEmployeeGrades] = useState<any[]>([]);
  const [employeeContracts, setEmployeeContracts] = useState<any[]>([]);
  const [portalContracts, setPortalContracts] = useState<any[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<any[]>([]);
  const [docPage, setDocPage] = useState(1);
  const [docTotalPages, setDocTotalPages] = useState(1);
  const [docTotalItems, setDocTotalItems] = useState(0);
  const [docLimit] = useState(10);
  const [docSortConfig, setDocSortConfig] = useState<{
    key: 'file_name' | 'type' | 'file_size' | 'created_at';
    direction: 'ASC' | 'DESC';
  }>({ key: 'created_at', direction: 'DESC' });

  // CV state
  const [employeeCvDocuments, setEmployeeCvDocuments] = useState<any[]>([]);
  const [cvPage, setCvPage] = useState(1);
  const [cvTotalPages, setCvTotalPages] = useState(1);
  const [cvTotalItems, setCvTotalItems] = useState(0);
  const [cvLimit] = useState(10);
  const [cvSortConfig, setCvSortConfig] = useState<{
    key: 'file_name' | 'file_size' | 'created_at';
    direction: 'ASC' | 'DESC';
  }>({ key: 'created_at', direction: 'DESC' });
  const [isCvUploading, setIsCvUploading] = useState(false);
  const [cvSelectedFile, setCvSelectedFile] = useState<File | null>(null);
  const [cvDragOver, setCvDragOver] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkInfoModal, setShowWorkInfoModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isWorkInfoEdit, setIsWorkInfoEdit] = useState(false);
  const [isGradeEdit, setIsGradeEdit] = useState(false);
  const [isContractEdit, setIsContractEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedWorkInfo, setSelectedWorkInfo] = useState<EmployeeWorkInformation | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<any | null>(null);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [workInfoToDelete, setWorkInfoToDelete] = useState<EmployeeWorkInformation | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<any | null>(null);
  const [contractToDelete, setContractToDelete] = useState<any | null>(null);
  const [grades, setGrades] = useState<GradeLookup[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<string[]>(['EMPLOYEE']);
  const targetHasAdmin = roles.includes(UserRole.ADMIN);
  const canEditEmployee = canManageEmployees && !(isActorHR && targetHasAdmin);
  const assignableRoles = isActorAdmin
    ? Object.values(UserRole)
    : [UserRole.EMPLOYEE, UserRole.HR, UserRole.FINANCIAL];
  const [deleteItemType, setDeleteItemType] = useState<'workinfo' | 'grade' | 'contract' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('employee-info');

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
    total_gap: 0,
    status: '',
    note: '',
    emergency_contact_name: '',
    emergency_contact: '',
    emergency_contact_relation: '',
  });

  const lastFetchedEmployeeId = useRef<string | null>(null);
  const fetchedTabs = useRef<Set<string>>(new Set(['employee-info']));

  // Scroll to top when the detail page mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (lastFetchedEmployeeId.current === employeeId) return;
    lastFetchedEmployeeId.current = employeeId;
    fetchEmployeeDetails();
  }, [employeeId]);

  useEffect(() => {
    if (!employee) return;

    if (!fetchedTabs.current.has(activeTab)) {
      if (activeTab === 'work-info') {
        fetchWorkInformations(employee.id);
      } else if (activeTab === 'grade-info') {
        fetchGrades();
        fetchEmployeeGrades(employee.id);
      } else if (activeTab === 'contract-info') {
        fetchEmployeeContracts(employee.id);
      } else if (activeTab === 'portal-contract-info') {
        fetchPortalContracts(employee.id);
      } else if (activeTab === 'document-info') {
        const ownerUserId = getEmployeeOwnerUserId(employee);
        if (ownerUserId) {
          fetchEmployeeDocuments(ownerUserId);
        }
      } else if (activeTab === 'cv-info') {
        fetchEmployeeCvDocuments(employee.id);
      }
      fetchedTabs.current.add(activeTab);
    }
  }, [activeTab, employee, canManageEmployees]);

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

  const fetchPortalContracts = async (empId: number) => {
    try {
      const response = await employeeService.getPortalContracts(empId);
      if (response.success && response.data) {
        setPortalContracts(response.data);
      } else {
        setPortalContracts([]);
      }
    } catch (error) {
      setPortalContracts([]);
    }
  };

  const fetchEmployeeContracts = async (empId: number) => {
    try {
      const response = await employeeContractService.getByEmployeeId(empId);

      if (response?.data) {
        let allContracts: any[] = [];

        // Check if response.data is paginated or direct array
        if ((response.data as any).items && Array.isArray((response.data as any).items)) {
          // Paginated response
          allContracts = (response.data as any).items;
        } else if (Array.isArray(response.data)) {
          // Direct array response
          allContracts = response.data as any[];
        }

        // Sort by start_date descending (en yeni en üstte)
        const sorted = allContracts.sort((a: any, b: any) => {
          const dateA = new Date(a.start_date || 0).getTime();
          const dateB = new Date(b.start_date || 0).getTime();
          return dateB - dateA;
        });

        setEmployeeContracts(sorted);
      } else {
        setEmployeeContracts([]);
      }
    } catch (error) {
      setEmployeeContracts([]);
    }
  };

  const getEmployeeOwnerUserId = (emp: typeof employee): number | null => {
    if (!emp) return null;
    const nestedId = emp.user?.id;
    if (typeof nestedId === 'number' && nestedId > 0) {
      return nestedId;
    }
    return null;
  };

  const fetchEmployeeDocuments = async (
    ownerUserId: number,
    page = 1,
    limit = 10,
    sort: string = docSortConfig.key,
    direction: 'ASC' | 'DESC' = docSortConfig.direction
  ) => {
    try {
      // Backend /documents/user/:id expects OwnerID (user id), not employee id.
      const response = await documentService.getUserDocuments(ownerUserId, {
        page,
        limit,
        sort,
        direction,
      });
      // API response: { data: [...], page: { total_pages, page, total, ... } }
      if (response?.data && Array.isArray(response.data)) {
        setEmployeeDocuments(response.data);
        setDocTotalPages(response.page?.total_pages ?? 1);
        setDocTotalItems(response.page?.total ?? 0);
        setDocPage(response.page?.page ?? page);
      } else {
        setEmployeeDocuments([]);
        setDocTotalPages(1);
        setDocTotalItems(0);
        setDocPage(1);
      }
    } catch (error) {
      setEmployeeDocuments([]);
      setDocTotalPages(1);
      setDocTotalItems(0);
      setDocPage(1);
    }
  };

  const handleDocSort = (key: 'file_name' | 'type' | 'file_size' | 'created_at') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (docSortConfig.key === key && docSortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setDocSortConfig({ key, direction });
    setDocPage(1);
    const ownerUserId = getEmployeeOwnerUserId(employee);
    if (ownerUserId) {
      fetchEmployeeDocuments(ownerUserId, 1, docLimit, key, direction);
    }
  };

  const getDocSortIcon = (columnKey: 'file_name' | 'type' | 'file_size' | 'created_at') => {
    if (docSortConfig.key !== columnKey) return null;
    return docSortConfig.direction === 'ASC'
      ? <ChevronUp size={14} className="ms-1" style={{ display: 'inline' }} />
      : <ChevronDown size={14} className="ms-1" style={{ display: 'inline' }} />;
  };

  const fetchEmployeeCvDocuments = async (
    empId: number,
    page = 1,
    limit = 10,
    sort: string = cvSortConfig.key,
    direction: 'ASC' | 'DESC' = cvSortConfig.direction
  ) => {
    try {
      const response = await documentService.getRelatedDocuments(
        ATTACHMENT_RELATED_TYPE_EMPLOYEE,
        empId,
        { page, limit, sort, direction }
      );
      if (response?.data && Array.isArray(response.data)) {
        setEmployeeCvDocuments(response.data);
        setCvTotalPages(response.page?.total_pages ?? 1);
        setCvTotalItems(response.page?.total ?? 0);
        setCvPage(response.page?.page ?? page);
      } else {
        setEmployeeCvDocuments([]);
        setCvTotalPages(1);
        setCvTotalItems(0);
        setCvPage(1);
      }
    } catch (error) {
      setEmployeeCvDocuments([]);
      setCvTotalPages(1);
      setCvTotalItems(0);
      setCvPage(1);
    }
  };

  const handleCvSort = (key: 'file_name' | 'file_size' | 'created_at') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (cvSortConfig.key === key && cvSortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setCvSortConfig({ key, direction });
    setCvPage(1);
    if (employee) {
      fetchEmployeeCvDocuments(employee.id, 1, cvLimit, key, direction);
    }
  };

  const getCvSortIcon = (columnKey: 'file_name' | 'file_size' | 'created_at') => {
    if (cvSortConfig.key !== columnKey) return null;
    return cvSortConfig.direction === 'ASC'
      ? <ChevronUp size={14} className="ms-1" style={{ display: 'inline' }} />
      : <ChevronDown size={14} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleCvFileSelect = (file: File) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Sadece PDF, DOC veya DOCX dosyaları yüklenebilir');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10 MB\'ı geçemez');
      return;
    }
    setCvSelectedFile(file);
  };

  const handleCvUpload = async () => {
    if (!cvSelectedFile || !employee) return;
    setIsCvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', cvSelectedFile);
      formData.append('related_type', String(ATTACHMENT_RELATED_TYPE_EMPLOYEE));
      formData.append('type', String(ATTACHMENT_TYPE_CV));

      const uploadRes = await documentService.uploadDocument(formData);
      if (!uploadRes?.data?.id) throw new Error('Yükleme başarısız');

      await documentService.linkDocuments(
        [uploadRes.data.id],
        ATTACHMENT_RELATED_TYPE_EMPLOYEE,
        employee.id
      );

      toast.success('CV başarıyla yüklendi');
      setCvSelectedFile(null);
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
      fetchedTabs.current.delete('cv-info');
      fetchEmployeeCvDocuments(employee.id, cvPage, cvLimit, cvSortConfig.key, cvSortConfig.direction);
      fetchedTabs.current.add('cv-info');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'CV yükleme başarısız');
    } finally {
      setIsCvUploading(false);
    }
  };

  const handleCvDelete = async (docId: string) => {
    if (!employee) return;
    try {
      await documentService.delete(docId);
      toast.success('CV silindi');
      fetchedTabs.current.delete('cv-info');
      fetchEmployeeCvDocuments(employee.id, cvPage, cvLimit, cvSortConfig.key, cvSortConfig.direction);
      fetchedTabs.current.add('cv-info');
    } catch (error: any) {
      toast.error('CV silinemedi');
    }
  };

  const handleDeleteWorkInfo = async () => {
    if (!workInfoToDelete || !canEditEmployee) return;

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
    if (!gradeToDelete || !canEditEmployee) return;

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

  const handleDeleteContract = async () => {
    if (!contractToDelete || !canEditEmployee) return;

    setIsDeleting(true);
    try {
      await employeeContractService.delete(contractToDelete.id);
      toast.success('Sözleşme başarıyla silindi');
      setShowDeleteModal(false);
      setContractToDelete(null);
      if (employee) {
        fetchEmployeeContracts(employee.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Silme işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = (role: string) => {
    if (!canEditEmployee) return;
    setRoles(prev => {
      const newRoles = prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role];
      return newRoles;
    });
  };

  const handleSaveEmployee = async () => {
    if (!employee || !canEditEmployee) return;

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
        status: employee.status,
        total_gap: parseFloat(String(employee.total_gap || 0)),
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

  const getContractType = (title: string | undefined | null): string => {
    if (!title) return '-';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('aydınlatma') || titleLower.includes('kvkk')) {
      return 'KVKK Metni';
    }
    if (titleLower.includes('gizlilik')) {
      return 'Gizlilik Sözleşmesi';
    }
    if (titleLower.includes('rüşvet') || titleLower.includes('yolsuzluk') || titleLower.includes('politika')) {
      return 'Politika';
    }
    if (titleLower.includes('fotoğraf') || titleLower.includes('görsel') || titleLower.includes('izin')) {
      return 'İzin Metni';
    }
    return 'Diğer';
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

  const getWorkInfoField = (field: 'job_title' | 'company_name' | 'department_name' | 'manager'): string => {
    // 1. Try to get from lazily loaded workInformations array if available
    if (workInformations.length > 0) {
      const wi = workInformations[0];
      switch (field) {
        case 'job_title': return wi.job_position?.title || '-';
        case 'company_name': return wi.company?.name || '-';
        case 'department_name': return wi.department?.name || '-';
        case 'manager': return wi.department?.manager || '-';
      }
    }

    // 2. Try to get from employee detail API response (which returns work_information as an array)
    if (Array.isArray(employee.work_information) && employee.work_information.length > 0) {
      return employee.work_information[0][field] || '-';
    }

    // 3. Try to get from employee list API response style (which returns object)
    if (employee.work_information && !Array.isArray(employee.work_information)) {
      return (employee.work_information as any)[field] || '-';
    }

    return '-';
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
              jobTitle: getWorkInfoField('job_title'),
              initials: getInitials(employee.first_name, employee.last_name),
              company: getWorkInfoField('company_name'),
              department: getWorkInfoField('department_name'),
              manager: getWorkInfoField('manager'),
              email: employee.email,
              phone: employee.phone || '-',
              address: employee.address || '-',
              totalExperience: getDisplayExperience(),
            }}
          />

          <div className="d-lg-none mb-4 pt-3">
            <h3 className="mb-0">{employee.first_name} {employee.last_name}</h3>
            <p className="text-muted mb-0">{getWorkInfoField('job_title')}</p>
          </div>

          <Tab.Container id="employee-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'employee-info')}>
            <Row className="g-4">
              <Col lg={3} md={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-3">
                    <Nav variant="pills" className="flex-column custom-vertical-nav">
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="employee-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <User size={16} />
                          <span>Çalışan Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="cv-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <FileText size={16} />
                          <span>CV Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="work-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Briefcase size={16} />
                          <span>İş Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="document-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Folder size={16} />
                          <span>Doküman Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="grade-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Award size={16} />
                          <span>Grade Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="contract-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Clipboard size={16} />
                          <span>Sözleşme Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="portal-contract-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Shield size={16} />
                          <span>Sözleşme Onayları</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="leave-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <Calendar size={16} />
                          <span>İzin Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item className="mb-1">
                        <Nav.Link eventKey="expense-info" className="d-flex align-items-center gap-2 py-2 px-3">
                          <DollarSign size={16} />
                          <span>Masraf Bilgileri</span>
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={9} md={8}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
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
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="lastName"
                            label="Soyad"
                            name="last_name"
                            value={employee.last_name}
                            onChange={(name, value) => setEmployee({ ...employee, last_name: value })}
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormDateField
                            label="Doğum Tarihi"
                            name="date_of_birth"
                            value={employee.date_of_birth ? employee.date_of_birth.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, date_of_birth: e.target.value })}
                          disabled={!canEditEmployee}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <FormSelectField
                            name="gender"
                            label="Cinsiyet"
                            value={employee.gender || ''}
                            onChange={(e) => setEmployee({ ...employee, gender: e.target.value })}
                            disabled={!canEditEmployee}
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
                            disabled={!canEditEmployee}
                          >
                            <option value="">Medeni durum seçiniz</option>
                            {maritalStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="fatherName"
                            label="Baba Adı"
                            name="father_name"
                            value={(employee as any).father_name || ''}
                            onChange={(name, value) => setEmployee({ ...employee, father_name: value } as any)}
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="phone"
                            label="Telefon No"
                            name="phone"
                            value={employee.phone || ''}
                            onChange={(name, value) => setEmployee({ ...employee, phone: value })}
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="state"
                            label="İlçe"
                            name="state"
                            value={employee.state || ''}
                            onChange={(name, value) => setEmployee({ ...employee, state: value })}
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormDateField
                            label="İşe Başlama Tarihi"
                            name="hire_date"
                            value={employee.hire_date ? employee.hire_date.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, hire_date: e.target.value })}
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormDateField
                            label="İşten Ayrılma Tarihi"
                            name="leave_date"
                            value={employee.leave_date ? employee.leave_date.split('T')[0] : ''}
                            onChange={(e) => setEmployee({ ...employee, leave_date: e.target.value })}
                          disabled={!canEditEmployee}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Toplam Boşluk (Yıl)</Form.Label>
                            <Form.Control
                              min={0}
                              type="number"
                              name="total_gap"
                              value={employee.total_gap}
                              onChange={(e) => setEmployee({ ...employee, total_gap: e.target.value || 0 } as any)}
                              placeholder="0"
                              disabled={!canEditEmployee}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <FormSelectField
                            name="status"
                            label="Statü"
                            value={employee.status || ''}
                            onChange={(e) => setEmployee({ ...employee, status: e.target.value as "ACTIVE" | "PASSIVE" | undefined })}
                            disabled={!canEditEmployee}
                          >
                            <option value="">Statü seçiniz</option>
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
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
                          disabled={!canEditEmployee}
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
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormTextField
                            controlId="emergencyContact"
                            label="Telefon No"
                            name="emergency_contact"
                            value={employee.emergency_contact || ''}
                            onChange={(name, value) => setEmployee({ ...employee, emergency_contact: value })}
                          disabled={!canEditEmployee}
                          />
                        </Col>
                        <Col md={4}>
                          <FormSelectField
                            name="emergency_contact_relation"
                            label="İlişki"
                            value={employee.emergency_contact_relation || ''}
                            onChange={(e) => setEmployee({ ...employee, emergency_contact_relation: e.target.value })}
                            disabled={!canEditEmployee}
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

                    {canEditEmployee ? (
                      <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        {assignableRoles.map(role => (
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
                    ) : (
                      <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        {roles.length ? roles.join(', ') : '-'}
                      </div>
                    )}

                    {canEditEmployee && (
                      <>
                        <hr style={{ margin: '1rem 0', borderColor: '#e9ecef' }} />
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
                      </>
                    )}

                    <LoadingOverlay show={isSaving} message="Kaydediliyor..." />

                  </Tab.Pane>

                  {/* İş Bilgileri Tab */}
                  {canManageEmployees && (
                  <Tab.Pane eventKey="work-info">
                    <div className={styles.section}>
                      {canEditEmployee && (
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
                      )}

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
                                  {canEditEmployee && (
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
                                        setDeleteItemType('workinfo');
                                        setShowDeleteModal(true);
                                      }}
                                      title="Sil"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  )}
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
                  )}

                  {/* Doküman Bilgileri Tab */}
                  <Tab.Pane eventKey="document-info">
                    <div className={styles.section}>
                      {employeeDocuments.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleDocSort('file_name')}>
                                Dosya Adı {getDocSortIcon('file_name')}
                              </th>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleDocSort('type')}>
                                Tip {getDocSortIcon('type')}
                              </th>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleDocSort('file_size')}>
                                Boyut {getDocSortIcon('file_size')}
                              </th>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleDocSort('created_at')}>
                                Yüklenme Tarihi {getDocSortIcon('created_at')}
                              </th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeDocuments.map((doc: any) => (
                              <tr key={doc.id}>
                                <td>{doc.file_name || '-'}</td>
                                <td>
                                  {doc.type === 1
                                    ? 'Fatura'
                                    : doc.type === 2
                                      ? 'Sağlık Raporu'
                                      : doc.type === 3
                                        ? 'Profil Resmi'
                                        : doc.type === 4
                                          ? 'Makbuz'
                                          : doc.type === 5
                                            ? 'Sözleşme'
                                            : doc.type === 6
                                              ? 'Kimlik'
                                              : doc.type === 7
                                                ? 'Diploma'
                                                : doc.type === 8
                                                  ? 'Sertifika'
                                                  : doc.type === 9
                                                    ? 'CV / Özgeçmiş'
                                                    : 'Diğer'
                                  }
                                </td>
                                <td>
                                  {doc.file_size
                                    ? doc.file_size < 1024 * 1024
                                      ? `${(doc.file_size / 1024).toFixed(2)} KB`
                                      : `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB`
                                    : '-'}
                                </td>
                                <td>{doc.created_at ? formatDate(doc.created_at) : '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await axiosInstance.get(`/documents/${doc.id}/download`);
                                          if (response.data.success && response.data.data?.url) {
                                            window.open(response.data.data.url, '_blank');
                                          }
                                        } catch (error) {
                                          toast.error('Dosya indirilemedi');
                                        }
                                      }}
                                      title="İndir"
                                    >
                                      <Download size={14} />
                                    </Button>
                                    {canEditEmployee && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await documentService.delete(doc.id);
                                            toast.success('Doküman silindi');
                                            const ownerUserId = getEmployeeOwnerUserId(employee);
                                            if (ownerUserId) {
                                              fetchEmployeeDocuments(ownerUserId, docPage, docLimit, docSortConfig.key, docSortConfig.direction);
                                            }
                                          } catch (error) {
                                            toast.error('Silme başarısız');
                                          }
                                        }}
                                        title="Sil"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">Doküman bilgisi kaydı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}
                      {docTotalPages > 1 && (
                        <div className="mt-3">
                          <CustomPagination
                            currentPage={docPage}
                            totalPages={docTotalPages}
                            totalItems={docTotalItems}
                            itemsPerPage={docLimit}
                            onPageChange={(page) => {
                              setDocPage(page);
                              const ownerUserId = getEmployeeOwnerUserId(employee);
                              if (ownerUserId) {
                                fetchEmployeeDocuments(ownerUserId, page, docLimit, docSortConfig.key, docSortConfig.direction);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Tab.Pane>

                  {/* Grade Bilgileri Tab */}
                  {canManageEmployees && (
                  <Tab.Pane eventKey="grade-info">
                    <div className={styles.section}>
                      {canEditEmployee && (
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
                      )}

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
                                  {canEditEmployee && (
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
                                  )}
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
                  )}

                  {/* Sözleşme Bilgileri Tab */}
                  {canManageEmployees && (
                  <Tab.Pane eventKey="contract-info">
                    <div className={styles.section}>
                      {canEditEmployee && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <Button
                          className="d-flex align-items-center"
                          variant="primary"
                          onClick={() => {
                            setSelectedContract(null);
                            setIsContractEdit(false);
                            setShowContractModal(true);
                            // Fetch contracts when opening modal
                            if (employee) {
                              fetchEmployeeContracts(employee.id);
                            }
                          }}
                        >
                          <i className="fe fe-plus"></i>
                          <span className="d-none d-lg-flex ms-2">Yeni Sözleşme</span>
                        </Button>
                      </div>
                      )}

                      {employeeContracts.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th>Sözleşme No</th>
                              <th>Proje Adı</th>
                              <th>Müşteri Yetkili</th>
                              <th>Başlama Tarihi</th>
                              <th>Bitiş Tarihi</th>
                              <th>Durum</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeContracts.map((empContract) => {
                              const contract = empContract.contract || {};
                              const isActive = !contract.end_date || new Date(contract.end_date) > new Date();
                              return (
                                <tr key={empContract.id}>
                                  <td>{contract.contract_no || '-'}</td>
                                  <td>{contract.project_name || '-'}</td>
                                  <td>{contract.customer_contact_name || '-'}</td>
                                  <td>{contract.start_date ? formatDate(contract.start_date) : '-'}</td>
                                  <td>{contract.end_date ? formatDate(contract.end_date) : '-'}</td>
                                  <td>
                                    <span className={`badge ${contract.status === 'ACTIVE' ? 'bg-success' :
                                      contract.status === 'COMPLETED' ? 'bg-primary' :
                                        contract.status === 'CANCELLED' ? 'bg-danger' :
                                          'bg-secondary'
                                      }`}>
                                      {contract.status || '-'}
                                    </span>
                                  </td>

                                  <td>
                                    {canEditEmployee && (
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedContract(empContract);
                                          setIsContractEdit(true);
                                          setShowContractModal(true);
                                        }}
                                        title="Düzenle"
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                          setContractToDelete(empContract);
                                          setDeleteItemType('contract');
                                          setShowDeleteModal(true);
                                        }}
                                        title="Sil"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">Sözleşme bilgisi kaydı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Tab.Pane>
                  )}

                  {/* Sözleşme Onay Durumları Tab */}
                  <Tab.Pane eventKey="portal-contract-info">
                    <div className={styles.section}>
                      {portalContracts.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th style={{ verticalAlign: 'middle', width: '35%' }}>Sözleşme Başlığı</th>
                              <th style={{ verticalAlign: 'middle', width: '25%' }}>Sözleşme Türü</th>
                              <th className="text-center" style={{ verticalAlign: 'middle', width: '20%' }}>Onay Tarihi</th>
                              <th className="text-center" style={{ verticalAlign: 'middle', width: '20%' }}>Durum</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portalContracts.map((portalContract) => (
                              <tr key={portalContract.contract_id}>
                                <td style={{ verticalAlign: 'middle' }}>{portalContract.title || '-'}</td>
                                <td style={{ verticalAlign: 'middle' }}>{getContractType(portalContract.title)}</td>
                                <td className="text-center" style={{ verticalAlign: 'middle' }}>{portalContract.approved_at ? formatDate(portalContract.approved_at) : '-'}</td>
                                <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                  <span className={`badge ${portalContract.status === 'approved' ? 'bg-success' :
                                      portalContract.status === 'pending' ? 'bg-warning text-dark' :
                                        portalContract.status === 'rejected' ? 'bg-danger' :
                                          'bg-secondary'
                                    }`} style={{ minWidth: '110px', padding: '0.45rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px' }}>
                                    {portalContract.status === 'approved' ? 'Onaylandı' :
                                      portalContract.status === 'pending' ? 'Onay Bekliyor' :
                                        portalContract.status === 'rejected' ? 'Reddedildi' :
                                          portalContract.status || '-'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">Sözleşme onay bilgisi kaydı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Tab.Pane>

                  {/* İzin Bilgileri Tab */}
                  {canManageEmployees && (
                  <Tab.Pane eventKey="leave-info">
                    <div className={styles.section}>
                      {activeTab === 'leave-info' && (
                        <EmployeeLeaveRequests employeeId={employeeId} hideCreateButton={true} />
                      )}
                    </div>
                  </Tab.Pane>
                  )}

                  {/* Masraf Bilgileri Tab */}
                  <Tab.Pane eventKey="expense-info">
                    <div className={styles.section}>
                      {activeTab === 'expense-info' && (
                        <EmployeeExpenseRequests employeeId={employeeId} hideCreateButton={true} />
                      )}
                    </div>
                  </Tab.Pane>

                  {/* CV Bilgileri Tab */}
                  <Tab.Pane eventKey="cv-info">
                    <div className={styles.section}>

                      {/* Upload Alanı */}
                      {canEditEmployee && (
                      <>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setCvDragOver(true); }}
                        onDragLeave={() => setCvDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCvDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleCvFileSelect(file);
                        }}
                        onClick={() => cvFileInputRef.current?.click()}
                        style={{
                          border: `2px dashed ${cvDragOver ? '#0d6efd' : '#dee2e6'}`,
                          borderRadius: '8px',
                          padding: '2rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: cvDragOver ? '#f0f5ff' : '#fafafa',
                          transition: 'all 0.2s',
                          marginBottom: '1.5rem',
                        }}
                      >
                        <input
                          ref={cvFileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCvFileSelect(file);
                          }}
                        />
                        <Upload size={32} color="#6c757d" style={{ marginBottom: '0.75rem' }} />
                        <p className="mb-1" style={{ fontWeight: 600, color: '#495057' }}>
                          {cvSelectedFile ? cvSelectedFile.name : 'CV dosyasını buraya sürükleyin veya tıklayın'}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                          PDF, DOC, DOCX · Maks 10 MB
                        </p>
                      </div>

                      {cvSelectedFile && (
                        <div className="d-flex justify-content-end gap-2 mb-4">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setCvSelectedFile(null);
                              if (cvFileInputRef.current) cvFileInputRef.current.value = '';
                            }}
                          >
                            Vazgeç
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCvUpload}
                            disabled={isCvUploading}
                            className="d-flex align-items-center gap-2"
                          >
                            <Upload size={14} />
                            {isCvUploading ? 'Yükleniyor...' : 'Yükle'}
                          </Button>
                        </div>
                      )}
                      </>
                      )}

                      {/* CV Listesi */}
                      {employeeCvDocuments.length > 0 ? (
                        <Table responsive className="table-list">
                          <thead>
                            <tr>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleCvSort('file_name')}>
                                Dosya Adı {getCvSortIcon('file_name')}
                              </th>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleCvSort('file_size')}>
                                Boyut {getCvSortIcon('file_size')}
                              </th>
                              <th className="sortable-header" style={{ cursor: 'pointer' }} onClick={() => handleCvSort('created_at')}>
                                Yüklenme Tarihi {getCvSortIcon('created_at')}
                              </th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeCvDocuments.map((doc: any) => (
                              <tr key={doc.id}>
                                <td>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                      background: '#e9ecef',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                    }}>
                                      {doc.file_name?.split('.').pop()?.toUpperCase() || 'DOC'}
                                    </span>
                                    {doc.file_name || '-'}
                                  </span>
                                </td>
                                <td>
                                  {doc.file_size
                                    ? doc.file_size < 1024 * 1024
                                      ? `${(doc.file_size / 1024).toFixed(1)} KB`
                                      : `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB`
                                    : '-'}
                                </td>
                                <td>{doc.created_at ? formatDate(doc.created_at) : '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      title="İndir"
                                      onClick={async () => {
                                        try {
                                          const response = await axiosInstance.get(`/documents/${doc.id}/download`);
                                          if (response.data.success && response.data.data?.url) {
                                            window.open(response.data.data.url, '_blank');
                                          }
                                        } catch {
                                          toast.error('Dosya indirilemedi');
                                        }
                                      }}
                                    >
                                      <Download size={14} />
                                    </Button>
                                    {canEditEmployee && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        title="Sil"
                                        onClick={() => handleCvDelete(doc.id)}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Card className="border-0 shadow-sm">
                          <Card.Body className="py-5 text-center">
                            <p className="text-muted mb-0">CV dokümanı bulunamadı</p>
                          </Card.Body>
                        </Card>
                      )}

                      {cvTotalPages > 1 && (
                        <div className="mt-3">
                          <CustomPagination
                            currentPage={cvPage}
                            totalPages={cvTotalPages}
                            totalItems={cvTotalItems}
                            itemsPerPage={cvLimit}
                            onPageChange={(page) => {
                              setCvPage(page);
                              fetchEmployeeCvDocuments(employee.id, page, cvLimit, cvSortConfig.key, cvSortConfig.direction);
                            }}
                          />
                        </div>
                      )}

                    </div>
                  </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
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

      <EmployeeContractModal
        show={showContractModal}
        onHide={() => {
          setShowContractModal(false);
          setSelectedContract(null);
          setIsContractEdit(false);
        }}
        onSave={() => {
          setShowContractModal(false);
          setSelectedContract(null);
          setIsContractEdit(false);
          if (employee) {
            fetchEmployeeContracts(employee.id);
          }
        }}
        employeeId={employee?.id || parseInt(employeeId)}
        employeeContract={selectedContract}
        isEdit={isContractEdit}
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

      {showDeleteModal && deleteItemType === 'contract' && (
        <DeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setContractToDelete(null);
          }}
          onHandleDelete={handleDeleteContract}
          loading={isDeleting}
          title="Sözleşme Sil"
          message="Sözleşmeyi silmek istediğinize emin misiniz?"
        />
      )}
    </Container>
  );
};

export default EmployeeDetailPage;
