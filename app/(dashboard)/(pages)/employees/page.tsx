"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Row, Col, Card, Table, Button, Container, Form } from 'react-bootstrap';
import { employeeService, lookupService } from '@/services';
import { Employee } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import EmployeeModal from '@/components/modals/EmployeeModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import MultiSelectField from '@/components/MultiSelectField';
import FormTextField from '@/components/FormTextField';
import { Trash2, Eye, ChevronUp, ChevronDown, Download as DownloadIcon } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { exportEmployeesToExcel } from '@/helpers/excelExport';
import { CompanyLookup, DepartmentLookup, GradeLookup, JobPositionLookup } from '@/services/lookup.service';
import { genderOptions, maritalStatusOptions, statusOptions } from '@/contants/options';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const badgeClass = status === "ACTIVE" ? "bg-success" : "bg-danger";
  const statusText = status === "ACTIVE" ? "Çalışıyor" : "Ayrıldı";
  return <span className={`badge ${badgeClass}`}>{statusText}</span>;
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState<{
    key: 'first_name' | 'last_name' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPositionLookup[]>([]);
  const [grades, setGrades] = useState<GradeLookup[]>([]);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Filter parameters
  const [filterParams, setFilterParams] = useState({
    first_name: '',
    email: '',
    department_ids: [] as string[], // Changed to array for multiple selection
    manager: '',
    identity_no: '',
    gender: '',
    marital_status: '',
    grade_id: ''
  });

  // Add STATUS filter state - default to ACTIVE
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const [quickSearchParams, setQuickSearchParams] = useState({
    company_id: '',
    department_ids: '',
    jobTitle: ''
  });
  const isQuickSearchInitialized = useRef(false);
  const skipNextAutoFilter = useRef(false);
  const isInitialLoad = useRef(true);
  const isLookupsFetched = useRef(false);

  const isReady = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch lookups on mount
  useEffect(() => {
    if (isLookupsFetched.current) return;
    isLookupsFetched.current = true;

    const fetchLookups = async () => {
      try {
        setCompaniesLoading(true);
        const [companiesRes, departmentsRes, gradesRes, jobPositionsRes] = await Promise.all([
          lookupService.getCompaniesLookup(),
          lookupService.getDepartmentsLookup(),
          lookupService.getGradesLookup(),
          lookupService.getJobPositionsLookup()
        ]);

        if (companiesRes.success && companiesRes.data) {
          setCompanies(companiesRes.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setAllDepartments(departmentsRes.data);
        }
        if (gradesRes.success && gradesRes.data) {
          setGrades(gradesRes.data);
        }
        if (jobPositionsRes.success && jobPositionsRes.data) {
          setJobPositions(jobPositionsRes.data);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message;
        toast.error(translateErrorMessage(errorMessage));
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchLookups();
  }, []);

  // Fetch departments based on selected company
  useEffect(() => {
    const companyId = quickSearchParams.company_id;
    if (companyId) {
      const loadDepartmentsByCompany = async () => {
        try {
          setDepartmentsLoading(true);
          const response = await lookupService.getDepartmentsByCompanyLookup(parseInt(companyId));
          if (response.success && response.data) {
            setDepartments(response.data);
          } else {
            setDepartments(allDepartments.filter((dept: any) => 
              dept.company_id && String(dept.company_id) === companyId
            ));
          }
        } catch (error: any) {
          setDepartments(allDepartments.filter((dept: any) => 
            dept.company_id && String(dept.company_id) === companyId
          ));
        } finally {
          setDepartmentsLoading(false);
        }
      };
      loadDepartmentsByCompany();
    } else {
      setDepartments([]);
    }
  }, [quickSearchParams.company_id, allDepartments]);

  // Helper function to update URL with current filters
  const updateURL = (filters: any, page: number, sortKey?: string, sortDir?: string, perPage?: number) => {
    const params = new URLSearchParams();
    
    // Add all filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });

    // Add pagination, sorting, and limit
    if (page > 1) params.set('page', String(page));
    if (sortKey) params.set('sort', sortKey);
    if (sortDir) params.set('direction', sortDir);
    if (perPage && perPage !== 10) params.set('limit', String(perPage));

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '/employees';
    router.push(newUrl, { scroll: false });
  };

  // Helper function to load filters from URL
  const loadFiltersFromURL = () => {
    const urlFilters: any = {};
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlSort = searchParams.get('sort') || null;
    const urlDirection = searchParams.get('direction') as 'ASC' | 'DESC' || 'ASC';
    const urlLimit = parseInt(searchParams.get('limit') || '10');

    // Load all filter parameters
    const firstName = searchParams.get('first_name');
    const email = searchParams.get('email');
    const departmentIds = searchParams.get('department_ids');
    const manager = searchParams.get('manager');
    const identityNo = searchParams.get('identity_no');
    const gender = searchParams.get('gender');
    const maritalStatus = searchParams.get('marital_status');
    const gradeId = searchParams.get('grade_id');
    const status = searchParams.get('status');
    const company_id = searchParams.get('company_id');
    const department_ids = searchParams.get('department_ids');
    const jobTitle = searchParams.get('jobTitle');

    // Set filter states
    if (firstName) urlFilters.first_name = firstName;
    if (email) urlFilters.email = email;
    if (departmentIds) urlFilters.department_ids = departmentIds.split(',');
    if (manager) urlFilters.manager = manager;
    if (identityNo) urlFilters.identity_no = identityNo;
    if (gender) urlFilters.gender = gender;
    if (maritalStatus) urlFilters.marital_status = maritalStatus;
    if (gradeId) urlFilters.grade_id = gradeId;

    return {
      filters: urlFilters,
      page: urlPage,
      sort: urlSort,
      direction: urlDirection,
      limit: urlLimit,
      status: status || 'ACTIVE',
      company_id: company_id || '',
      department_ids: department_ids || '',
      jobTitle: jobTitle || ''
    };
  };

  const fetchEmployees = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC', filters?: any, perPage?: number) => {
    try {
      setIsLoading(true);

      const rawParams: any = {
        page,
        limit: perPage || itemsPerPage,
        sort: sortKey,
        direction: sortDir,
        ...filters
      };

      const params = Object.entries(rawParams).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) {
          return acc;
        }

        if (typeof value === 'string' && value.trim() === '') {
          return acc;
        }

        if (Array.isArray(value) && value.length === 0) {
          return acc;
        }

        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        query.set(key, String(value));
      });
      console.log(`[Employees API] /api/v1/employees?${query.toString()}`);

      const response = await employeeService.getAll(params);

      if (response.data) {
        setEmployees(response.data);
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load filters from URL on initial mount
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      
      const urlData = loadFiltersFromURL();
      
      // Set all states from URL
      setFilterParams({
        first_name: urlData.filters.first_name || '',
        email: urlData.filters.email || '',
        department_ids: urlData.filters.department_ids || [],
        manager: urlData.filters.manager || '',
        identity_no: urlData.filters.identity_no || '',
        gender: urlData.filters.gender || '',
        marital_status: urlData.filters.marital_status || '',
        grade_id: urlData.filters.grade_id || ''
      });
      
      setQuickSearchParams({
        company_id: urlData.company_id || '',
        department_ids: urlData.department_ids || '',
        jobTitle: urlData.jobTitle
      });
      
      setStatusFilter(urlData.status);
      setItemsPerPage(urlData.limit);
      
      if (urlData.sort) {
        setSortConfig({
          key: urlData.sort as 'first_name' | 'last_name',
          direction: urlData.direction
        });
      }

      // Fetch with URL parameters
      const allFilters = {
        ...urlData.filters,
        status: urlData.status
      };
      
      if (urlData.company_id) allFilters.company_id = urlData.company_id;
      if (urlData.department_ids) allFilters.department_ids = urlData.department_ids;
      if (urlData.jobTitle) allFilters.jobTitle = urlData.jobTitle;

      fetchEmployees(
        urlData.page,
        urlData.sort || undefined,
        urlData.direction,
        allFilters,
        urlData.limit
      );

      // Allow autoFilter to start capturing changes after initial render cascade is complete
      setTimeout(() => {
        isReady.current = true;
      }, 300);
    }
  }, []);

  const handleQuickSearchChange = (name: 'company_id' | 'department_ids' | 'jobTitle', value: string) => {
    setQuickSearchParams(prev => {
      const nextState = {
        ...prev,
        [name]: value
      };
      
      if (name === 'company_id' && prev.company_id !== value) {
        nextState.department_ids = '';
      }
      
      return nextState;
    });
  };

  const getQuickSearchFilters = () => {
    const quickFilters: Record<string, string> = {};

    if (quickSearchParams.company_id.trim()) {
      const companyValue = quickSearchParams.company_id.trim();
      quickFilters.company_id = companyValue;
    }

    if (quickSearchParams.department_ids.trim()) {
      const departmentValue = quickSearchParams.department_ids.trim();
      quickFilters.department_ids = departmentValue;
    }

    if (quickSearchParams.jobTitle.trim()) {
      const jobTitleValue = quickSearchParams.jobTitle.trim();
      quickFilters.jobTitle = jobTitleValue;
      quickFilters.job_title = jobTitleValue;
    }

    return quickFilters;
  };

  const getActiveFilters = () => {
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(',');
        }
      } else if (value && value.toString().trim() !== '') {
        const strValue = value.toString().trim();
        // Minimum 3 characters rule for text-based real-time filters
        if ((key === 'first_name' || key === 'manager') && strValue.length > 0 && strValue.length < 3) {
          // Ignore filter if less than 3 characters
        } else {
          acc[key] = strValue;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

    return activeFilters;
  };

  const departmentIdsStr = filterParams.department_ids?.join(',') || '';

  useEffect(() => {
    if (!isReady.current) {
      return;
    }

    if (skipNextAutoFilter.current) {
      skipNextAutoFilter.current = false;
      return;
    }

    // Store last API payload to prevent redundant calls on < 3 char typing
    const timer = setTimeout(() => {
      // 1-2 karakter girildiğinde hiç istek atmaması için erken dönüş (block)
      const firstNameLen = filterParams.first_name?.trim().length || 0;
      const managerLen = filterParams.manager?.trim().length || 0;

      if ((firstNameLen > 0 && firstNameLen < 3) || (managerLen > 0 && managerLen < 3)) {
        return;
      }

      const activeFilters = getActiveFilters();

      const quickFilters = getQuickSearchFilters();

      const allFilters = {
        ...activeFilters,
        ...quickFilters
      };

      // Update URL with current filters
      updateURL(allFilters, 1, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);

      fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, allFilters, itemsPerPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    quickSearchParams.company_id,
    quickSearchParams.department_ids,
    quickSearchParams.jobTitle,
    filterParams.first_name,
    filterParams.email,
    departmentIdsStr,
    filterParams.manager,
    filterParams.identity_no,
    filterParams.gender,
    filterParams.marital_status,
    filterParams.grade_id,
    statusFilter
  ]);

  const handleFilterChange = (name: string, value: string | string[]) => {
    setFilterParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    const activeFilters = getActiveFilters();

    const quickFilters = getQuickSearchFilters();

    const allFilters = {
      ...activeFilters,
      ...quickFilters
    };

    // Update URL with current filters
    updateURL(allFilters, 1, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);

    fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, allFilters, itemsPerPage);
  };

  const clearFilters = () => {
    skipNextAutoFilter.current = true;
    setFilterParams({
      first_name: '',
      email: '',
      department_ids: [], // Reset to empty array
      manager: '',
      identity_no: '',
      gender: '',
      marital_status: '',
      grade_id: ''
    });
    setQuickSearchParams({
      company_id: '',
      department_ids: '',
      jobTitle: ''
    });
    setStatusFilter('ACTIVE'); // Reset to ACTIVE
    setSortConfig({ key: null, direction: 'ASC' });
    setItemsPerPage(10);
    
    // Update URL to only have status=ACTIVE
    updateURL({ status: 'ACTIVE' }, 1, undefined, 'ASC', 10);
    
    fetchEmployees(1, undefined, 'ASC', { status: 'ACTIVE' }, 10);
  };

  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);
      const activeFilters = getActiveFilters();
      const quickFilters = getQuickSearchFilters();
      const allFilters = {
        ...activeFilters,
        ...quickFilters
      };

      const response = await employeeService.getAll({
        ...allFilters,
        page: 1,
        limit: 10000,
        sort: sortConfig.key || undefined,
        direction: sortConfig.direction
      });

      if (response.success && response.data) {
        await exportEmployeesToExcel(response.data);
        toast.success("Excel'e başarıyla aktarıldı");
      } else {
        toast.warning("Dışa aktarılacak veri bulunamadı");
      }
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message || 'Excel oluşturulurken hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: 'first_name' | 'last_name') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });

    // Apply filters when sorting
    const activeFilters = getActiveFilters();

    const quickFilters = getQuickSearchFilters();

    const allFilters = {
      ...activeFilters,
      ...quickFilters
    };

    // Update URL with current filters and sorting
    updateURL(allFilters, 1, key, direction, itemsPerPage);

    fetchEmployees(1, key, direction, allFilters, itemsPerPage);
  };

  const getSortIcon = (columnKey: 'first_name' | 'last_name') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleView = (employee: Employee) => {
    router.push(`/employees/${employee.id}`);
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedEmployee) {
      setDeleteLoading(true);
      try {
        await employeeService.delete(selectedEmployee.id);
        toast.success('Çalışan başarıyla silindi');
        const activeFilters = getActiveFilters();

        const quickFilters = getQuickSearchFilters();

        fetchEmployees(currentPage, sortConfig.key || undefined, sortConfig.direction, {
          ...activeFilters,
          ...quickFilters
        }, itemsPerPage);
        setShowDeleteModal(false);
        setSelectedEmployee(null);
      } catch (error: any) {
        let errorMessage = '';

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data) {
          errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = 'Silme işlemi sırasında bir hata oluştu';
        }

        const translatedError = translateErrorMessage(errorMessage);
        toast.error(translatedError);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleModalSave = () => {
    // Apply current filters when refreshing after modal save
    const activeFilters = getActiveFilters();

    const quickFilters = getQuickSearchFilters();

    fetchEmployees(currentPage, sortConfig.key || undefined, sortConfig.direction, {
      ...activeFilters,
      ...quickFilters
    }, itemsPerPage);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedEmployee(null);
  };

  const handlePageChange = (newPage: number) => {
    // Apply current filters when changing pages
    const activeFilters = getActiveFilters();

    const quickFilters = getQuickSearchFilters();

    const allFilters = {
      ...activeFilters,
      ...quickFilters
    };

    // Update URL with current page
    updateURL(allFilters, newPage, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);

    fetchEmployees(newPage, sortConfig.key || undefined, sortConfig.direction, allFilters, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);

    // Apply current filters with new page size
    const activeFilters = getActiveFilters();

    const quickFilters = getQuickSearchFilters();

    const allFilters = {
      ...activeFilters,
      ...quickFilters
    };

    // Update URL with new page size
    updateURL(allFilters, 1, sortConfig.key || undefined, sortConfig.direction, newPageSize);

    fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, allFilters, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Çalışanlar yükleniyor..." />

        <div className="page-heading-wrapper">
          <PageHeading
            heading="Çalışanlar"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni Çalışan"
            onCreate={handleAddNew}
          />
        </div>

        {/* Tüm Filtreler Tek Kartta */}
        <Row className="mb-3">
          <Col lg={12} md={12} sm={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {/* Hızlı Filtreler */}
                <Row className="g-3 align-items-end mb-3">
                  <Col lg={3} md={6} sm={12}>
                    <FormTextField
                      controlId="filter-first-name"
                      label="Ad Soyad"
                      name="first_name"
                      type="text"
                      value={filterParams.first_name}
                      onChange={(name, value) => handleFilterChange(name, value)}
                      placeholder="Ad soyad giriniz"
                    />
                  </Col>
                  <Col lg={3} md={6} sm={12}>
                    <FormSelectField
                      label="Şirket"
                      name="quick-company_id"
                      value={quickSearchParams.company_id}
                      onChange={(e) => handleQuickSearchChange('company_id', e.target.value)}
                      disabled={companiesLoading}
                    >
                      <option value="">Şirket seçiniz</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id.toString()}>
                          {company.name}
                        </option>
                      ))}
                    </FormSelectField>
                  </Col>
                  <Col lg={3} md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Departman</Form.Label>
                      <MultiSelectField
                        name="quick-department_ids"
                        value={quickSearchParams.department_ids ? quickSearchParams.department_ids.split(',').filter(Boolean) : []}
                        onChange={(values: string[]) => handleQuickSearchChange('department_ids', values.join(','))}
                        options={departments.map((dept) => ({
                          value: String(dept.id),
                          label: dept.name,
                        }))}
                        disabled={departmentsLoading || !quickSearchParams.company_id}
                        loading={departmentsLoading}
                        placeholder={!quickSearchParams.company_id ? "Doldurmak için Önce Şirket Seçiniz" : "Departman seçiniz"}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6} sm={12}>
                    <FormSelectField
                      label="Unvan"
                      name="quick-job-title"
                      value={quickSearchParams.jobTitle}
                      onChange={(e) => handleQuickSearchChange('jobTitle', e.target.value)}
                    >
                      <option value="">Unvan seçiniz</option>
                      {jobPositions.map((position) => (
                        <option key={position.id} value={position.title}>
                          {position.title}
                        </option>
                      ))}
                    </FormSelectField>
                  </Col>
                </Row>

                {/* Gelişmiş filtreler - butona basınca açılır */}
                {showFilters && (
                  <>
                    <hr className="my-3 text-muted opacity-25" />
                    <Row className="g-3 align-items-end mb-3">
                      <Col lg={3} md={6} sm={12}>
                        <FormTextField
                          controlId="filter-email"
                          label="Email"
                          name="email"
                          type="email"
                          value={filterParams.email}
                          onChange={(name, value) => handleFilterChange(name, value)}
                          placeholder="Email giriniz"
                        />
                      </Col>
                      <Col lg={3} md={6} sm={12}>
                        <FormTextField
                          controlId="filter-manager"
                          label="Manager"
                          name="manager"
                          type="text"
                          value={filterParams.manager}
                          onChange={(name, value) => handleFilterChange(name, value)}
                          placeholder="Manager giriniz"
                        />
                      </Col>
                      <Col lg={3} md={6} sm={12}>
                        <FormSelectField
                          label="Cinsiyet"
                          name="gender"
                          value={filterParams.gender}
                          onChange={(e) => handleFilterChange('gender', e.target.value)}
                        >
                          <option value="">Cinsiyet seçiniz</option>
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </FormSelectField>
                      </Col>
                      <Col lg={3} md={6} sm={12}>
                        <FormSelectField
                          label="Medeni Durum"
                          name="marital_status"
                          value={filterParams.marital_status}
                          onChange={(e) => handleFilterChange('marital_status', e.target.value)}
                        >
                          <option value="">Medeni durum seçiniz</option>
                          {maritalStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </FormSelectField>
                      </Col>
                      <Col lg={3} md={6} sm={12}>
                        <FormSelectField
                          label="Grade"
                          name="grade_id"
                          value={filterParams.grade_id}
                          onChange={(e) => handleFilterChange('grade_id', e.target.value)}
                        >
                          <option value="">Grade seçiniz</option>
                          {grades.map((grade) => (
                            <option key={grade.id} value={String(grade.id)}>
                              {grade.name}
                            </option>
                          ))}
                        </FormSelectField>
                      </Col>
                      <Col lg={3} md={6} sm={12}>
                        <Form.Group>
                          <Form.Label>Statü</Form.Label>
                          <FormSelectField
                            name="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="">Statü Seçiniz</option>
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelectField>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                {/* Butonlar */}
                <Row>
                  <Col lg={12} md={12} sm={12} className="text-end">
                    <Button
                      variant={showFilters ? "primary" : "outline-primary"}
                      size="sm"
                      className="me-2"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? 'Gelişmiş Filtreleri Gizle' : 'Gelişmiş Filtreler'}
                    </Button>
                    <Button variant="secondary" size="sm" className="me-2" onClick={clearFilters}>
                      Temizle
                    </Button>
                    <Button variant="success" size="sm" onClick={handleExportToExcel} disabled={isLoading}>
                      <DownloadIcon size={14} className="me-1" style={{ display: 'inline' }} />
                      Excel'e İndir
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={12} md={12} sm={12}>

            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th
                              onClick={() => handleSort('first_name')}
                              className="sortable-header"
                            >
                              Ad Soyad {getSortIcon('first_name')}
                            </th>
                            <th>Çalıştığı Şirket</th>
                            <th>Departman</th>
                            <th>Manager</th>
                            <th>Statü</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length ? (
                            employees.map((employee: Employee) => (
                              <tr key={employee.id}>
                                <td>{employee.id}</td>
                                <td>{employee.first_name} {employee.last_name}</td>
                                <td>{employee.work_information?.company_name || '-'}</td>
                                <td>{employee.work_information?.department_name || '-'}</td>
                                <td>{employee.work_information?.manager || '-'}</td>
                                <td>
                                  <EmployeeStatusBadge status={employee.status || "UNKNOWN"} />
                                </td>
                                <td>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleView(employee)}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(employee)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-4">
                                Veri bulunamadı
                              </td>
                            </tr>

                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {!isLoading && totalItems > 0 && (
          <Row className="mt-4">
            <Col lg={12} md={12} sm={12}>
              <div className="px-3">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </Col>
          </Row>
        )}

        <EmployeeModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleModalSave}
          employee={selectedEmployee}
        />

        {showDeleteModal && (
          <DeleteModal
            onClose={handleCloseDeleteModal}
            onHandleDelete={handleDelete}
            loading={deleteLoading}
          />
        )}
      </Container>
    </>
  );
};

export default EmployeesPage;