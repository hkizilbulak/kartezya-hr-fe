"use client";
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Table } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { WorkDayReportResponse, WorkDayReportRow } from '@/models/hr/report.model';
import { CompanyLookup, DepartmentLookup } from '@/services/lookup.service';
import { PageHeading } from '@/widgets';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Download as DownloadIcon, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import * as ExcelUtils from '@/helpers/excelExport';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const WorkDayReportPage = () => {
  const [reportData, setReportData] = useState<WorkDayReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize as true for initial loading
  const [showTable, setShowTable] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: 'first_name' | 'last_name' | 'identity_no' | 'company_name' | 'department_name' | 'work_days' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  // Initialize dates on mount
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Fetch companies and all departments on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setIsLoading(true); // Show loading while fetching lookups
        setCompaniesLoading(true);
        const [companiesRes, departmentsRes] = await Promise.all([
          lookupService.getCompaniesLookup(),
          lookupService.getDepartmentsLookup()
        ]);
        
        if (companiesRes.success && companiesRes.data) {
          setCompanies(companiesRes.data);
        }
        if (departmentsRes.success && departmentsRes.data) {
          setAllDepartments(departmentsRes.data);
          setDepartments([]);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message;
        toast.error(translateErrorMessage(errorMessage));
      } finally {
        setCompaniesLoading(false);
        setIsLoading(false); // Hide loading after lookups are fetched
      }
    };

    fetchLookups();
  }, []);

  // Şirket değiştiğinde departmanları filtrele
  useEffect(() => {
    if (selectedCompany) {
      const loadDepartmentsByCompany = async () => {
        try {
          setDepartmentsLoading(true);
          const response = await lookupService.getDepartmentsByCompanyLookup(parseInt(selectedCompany));
          if (response.success && response.data) {
            setDepartments(response.data);
          } else {
            setDepartments(allDepartments.filter((dept: any) => 
              dept.company_id && String(dept.company_id) === selectedCompany
            ));
          }
        } catch (error: any) {
          setDepartments(allDepartments.filter((dept: any) => 
            dept.company_id && String(dept.company_id) === selectedCompany
          ));
        } finally {
          setDepartmentsLoading(false);
        }
      };

      loadDepartmentsByCompany();
      setSelectedDepartment('');
    } else {
      setDepartments([]);
      setSelectedDepartment('');
    }
  }, [selectedCompany, allDepartments]);

  const handleGetReport = async () => {
    if (!startDate || !endDate) {
      toast.warning('Lütfen başlangıç ve bitiş tarihini belirtiniz');
      return;
    }

    try {
      setIsLoading(true);
      setShowTable(false);

      const response = await reportService.getWorkDayReport(
        startDate,
        endDate,
        selectedCompany ? parseInt(selectedCompany) : undefined,
        selectedDepartment ? parseInt(selectedDepartment) : undefined,
        isActive
      );

      setReportData(response);
      setShowTable(true);
      setCurrentPage(1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Rapor çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!reportData) {
      toast.warning('Önce raporu getirmelisiniz');
      return;
    }

    try {
      await ExcelUtils.exportToExcel(reportData);
      toast.success('Rapor Excel\'e başarıyla aktarıldı');
    } catch (error: any) {
      toast.error('Excel export sırasında hata oluştu');
    }
  };

  const handleSort = (key: 'first_name' | 'last_name' | 'identity_no' | 'company_name' | 'department_name' | 'work_days') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: 'first_name' | 'last_name' | 'identity_no' | 'company_name' | 'department_name' | 'work_days') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const getSortedAndPaginatedData = () => {
    if (!reportData?.rows) return [];

    let sorted = [...reportData.rows];

    // Apply sorting
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof WorkDayReportRow];
        const bValue = b[sortConfig.key as keyof WorkDayReportRow];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ASC' 
            ? aValue.localeCompare(bValue, 'tr-TR')
            : bValue.localeCompare(aValue, 'tr-TR');
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ASC'
            ? aValue - bValue
            : bValue - aValue;
        }

        return 0;
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sorted.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!reportData?.rows) return 1;
    return Math.ceil(reportData.rows.length / itemsPerPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading || companiesLoading} message={companiesLoading ? "Yükleniyor..." : "Rapor yükleniyor..."} />
        
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Çalışma Günü Raporu"
            showCreateButton={false}
            showFilterButton={false}
          />
        </div>

        {/* Filtreleme Kartı */}
        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="table-wrapper">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Row className="g-3">
                    {/* Start Date */}
                    <Col md={6} lg={3}>
                      <FormDateField
                        label="Başlangıç Tarihi"
                        name="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Col>

                    {/* End Date */}
                    <Col md={6} lg={3}>
                      <FormDateField
                        label="Bitiş Tarihi"
                        name="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Col>

                    {/* Company Select */}
                    <Col md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="fw-500">Şirket</Form.Label>
                        <FormSelectField
                          name="selectedCompany"
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          disabled={companiesLoading}
                        >
                          <option value="">Şirket Seçiniz</option>
                          {companies.map((company) => (
                            <option key={company.id} value={String(company.id)}>
                              {company.name}
                            </option>
                          ))}
                        </FormSelectField>
                      </Form.Group>
                    </Col>

                    {/* Department Select */}
                    <Col md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="fw-500">Departman</Form.Label>
                        <FormSelectField
                          name="selectedDepartment"
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          disabled={departmentsLoading}
                        >
                          <option value="">Departman Seçiniz</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </option>
                          ))}
                        </FormSelectField>
                      </Form.Group>
                    </Col>

                    {/* Sadece Aktif Çalışanlar */}
                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        id="isActiveCheckbox"
                        label="Sadece Aktif Çalışanlar"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                    </Col>

                    {/* Butonlar */}
                    <Col xs={12} className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="primary"
                        onClick={handleGetReport}
                        disabled={!startDate || !endDate}
                      >Raporu Getir</Button>
                      {showTable && reportData && (
                        <Button
                          variant="success"
                          onClick={handleExportToExcel}
                        >
                          <DownloadIcon size={18} className="me-2" style={{ display: 'inline' }} />
                          Excel'e İndir
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Report Table */}
        {showTable && reportData && (
          <>
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
                                  AD SOYAD {getSortIcon('first_name')}
                                </th>
                                <th
                                  onClick={() => handleSort('work_days')}
                                  className="sortable-header text-end"
                                >
                                  İŞ GÜNÜ {getSortIcon('work_days')}
                                </th>
                                <th className="text-end">RESMİ TATİL</th>
                                <th className="text-end">KULLANILAN İZİN</th>
                                <th className="text-end">ÇALIŞILAN GÜN</th>
                                <th
                                  onClick={() => handleSort('company_name')}
                                  className="sortable-header"
                                >
                                  ŞİRKET {getSortIcon('company_name')}
                                </th>
                                <th
                                  onClick={() => handleSort('department_name')}
                                  className="sortable-header"
                                >
                                  DEPARTMAN {getSortIcon('department_name')}
                                </th>
                                <th>YÖNETİCİ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedAndPaginatedData().length > 0 ? (
                                getSortedAndPaginatedData().map((row: WorkDayReportRow) => (
                                  <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.first_name} {row.last_name}</td>
                                    <td className="text-end">{Math.round(row.work_days)}</td>
                                    <td className="text-end">{Math.round(row.holiday_days)}</td>
                                    <td className="text-end">{row.used_leave_days.toFixed(1)}</td>
                                    <td className="text-end">{row.worked_days.toFixed(1)}</td>
                                    <td>{row.company_name}</td>
                                    <td>{row.department_name}</td>
                                    <td>{row.manager || '-'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={9} className="text-center py-4">
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

            {reportData && reportData.rows && reportData.rows.length > 0 && !isLoading && (
              <Row className="mt-4">
                <Col lg={12} md={12} sm={12}>
                  <div className="px-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={getTotalPages()}
                      totalItems={reportData.rows?.length || 0}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default WorkDayReportPage;
