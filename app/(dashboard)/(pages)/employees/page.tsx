"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Card, Table, Button, Container, Form } from 'react-bootstrap';
import { employeeService, lookupService } from '@/services';
import { Employee } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import EmployeeModal from '@/components/modals/EmployeeModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import FormTextField from '@/components/FormTextField';
import { Trash2, Eye, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
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
    company: '',
    department: '',
    jobTitle: ''
  });
  const isQuickSearchInitialized = useRef(false);
  const skipNextAutoFilter = useRef(false);

  const router = useRouter();

  // Fetch lookups on mount
  useEffect(() => {
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
    // Fetch employees with ACTIVE status on initial load
    fetchEmployees(1, undefined, 'ASC', { status: 'ACTIVE' }, 10);
  }, []);

  const handleQuickSearchChange = (name: 'company' | 'department' | 'jobTitle', value: string) => {
    setQuickSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getQuickSearchFilters = () => {
    const quickFilters: Record<string, string> = {};

    if (quickSearchParams.company.trim()) {
      const companyValue = quickSearchParams.company.trim();
      quickFilters.company = companyValue;
      quickFilters.company_name = companyValue;
    }

    if (quickSearchParams.department.trim()) {
      const departmentValue = quickSearchParams.department.trim();
      quickFilters.department = departmentValue;
      quickFilters.department_name = departmentValue;
    }

    if (quickSearchParams.jobTitle.trim()) {
      const jobTitleValue = quickSearchParams.jobTitle.trim();
      quickFilters.jobTitle = jobTitleValue;
      quickFilters.job_title = jobTitleValue;
    }

    return quickFilters;
  };

  useEffect(() => {
    if (!isQuickSearchInitialized.current) {
      isQuickSearchInitialized.current = true;
      return;
    }

    if (skipNextAutoFilter.current) {
      skipNextAutoFilter.current = false;
      return;
    }

    // Debounce all filter changes for instant filtering without excessive API calls.
    const timer = setTimeout(() => {
      const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
        if (key === 'department_ids') {
          if (Array.isArray(value) && value.length > 0) {
            acc['department_ids'] = value.join(',');
          }
        } else if (value && value.toString().trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (statusFilter) {
        activeFilters['status'] = statusFilter;
      }

      const quickFilters = getQuickSearchFilters();

      fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, {
        ...activeFilters,
        ...quickFilters
      }, itemsPerPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    quickSearchParams.company,
    quickSearchParams.department,
    quickSearchParams.jobTitle,
    filterParams.first_name,
    filterParams.email,
    filterParams.department_ids,
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
    // Filter out empty values
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        // Handle department_ids as array
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(','); // Convert array to comma-separated string for API
        }
      } else if (value && value.toString().trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

    const quickFilters = getQuickSearchFilters();

    fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, {
      ...activeFilters,
      ...quickFilters
    }, itemsPerPage);
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
      company: '',
      department: '',
      jobTitle: ''
    });
    setStatusFilter('ACTIVE'); // Reset to ACTIVE
    fetchEmployees(1, undefined, 'ASC', { status: 'ACTIVE' }, 10);
  };

  const handleSort = (key: 'first_name' | 'last_name') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    
    // Apply filters when sorting
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(',');
        }
      } else if (value && value.toString().trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

    const quickFilters = getQuickSearchFilters();

    fetchEmployees(1, key, direction, {
      ...activeFilters,
      ...quickFilters
    }, itemsPerPage);
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
        const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
          if (key === 'department_ids') {
            if (Array.isArray(value) && value.length > 0) {
              acc['department_ids'] = value.join(',');
            }
          } else if (value && value.toString().trim() !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as any);

        if (statusFilter) {
          activeFilters['status'] = statusFilter;
        }

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
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(',');
        }
      } else if (value && value.toString().trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

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
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        // Handle department_ids as array
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(','); // Convert array to comma-separated string for API
        }
      } else if (value && value.toString().trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

    const quickFilters = getQuickSearchFilters();

    fetchEmployees(newPage, sortConfig.key || undefined, sortConfig.direction, {
      ...activeFilters,
      ...quickFilters
    }, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    
    // Apply current filters with new page size
    const activeFilters = Object.entries(filterParams).reduce((acc, [key, value]) => {
      if (key === 'department_ids') {
        if (Array.isArray(value) && value.length > 0) {
          acc['department_ids'] = value.join(',');
        }
      } else if (value && value.toString().trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (statusFilter) {
      activeFilters['status'] = statusFilter;
    }

    const quickFilters = getQuickSearchFilters();

    fetchEmployees(1, sortConfig.key || undefined, sortConfig.direction, {
      ...activeFilters,
      ...quickFilters
    }, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Çalışanlar yükleniyor..." />
        
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Çalışanlar"
            showCreateButton={true}
            showFilterButton={true}
            createButtonText="Yeni Çalışan"
            onCreate={handleAddNew}
            onToggleFilter={() => setShowFilters(!showFilters)}
          />
        </div>

        {showFilters && (
          <Row className="mb-4">
            <Col lg={12} md={12} sm={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col lg={3} md={6} sm={12}>
                      <FormSelectField
                        label="Şirket"
                        name="quick-company"
                        value={quickSearchParams.company}
                        onChange={(e) => handleQuickSearchChange('company', e.target.value)}
                        disabled={companiesLoading}
                      >
                        <option value="">Şirket seçiniz</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.name}>
                            {company.name}
                          </option>
                        ))}
                      </FormSelectField>
                    </Col>
                    <Col lg={3} md={6} sm={12}>
                      <FormSelectField
                        label="Departman"
                        name="quick-department"
                        value={quickSearchParams.department}
                        onChange={(e) => handleQuickSearchChange('department', e.target.value)}
                      >
                        <option value="">Departman seçiniz</option>
                        {allDepartments.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}
                          </option>
                        ))}
                      </FormSelectField>
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
                      <FormTextField
                        controlId="filter-identity-no"
                        label="Kimlik No"
                        name="identity_no"
                        type="text"
                        value={filterParams.identity_no}
                        onChange={(name, value) => handleFilterChange(name, value)}
                        placeholder="Kimlik no giriniz"
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
                  <Row className="mt-3">
                    <Col lg={12} md={12} sm={12} className="text-end">
                      <Button variant="primary" className="me-2" onClick={applyFilters}>
                        Filtrele
                      </Button>
                      <Button variant="secondary" onClick={clearFilters}>
                        Temizle
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

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