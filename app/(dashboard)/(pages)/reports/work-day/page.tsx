"use client";
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { WorkDayReportResponse, WorkDayReportRow } from '@/models/hr/report.model';
import { CompanyLookup, DepartmentLookup } from '@/services/lookup.service';
import { PageHeading } from '@/widgets';
import FormDateField from '@/components/FormDateField';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Download as DownloadIcon, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import * as ExcelUtils from '@/helpers/excelExport';
import '@/styles/table-list.scss';

const WorkDayReportPage = () => {
  const [reportData, setReportData] = useState<WorkDayReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const itemsPerPage = 10;
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
      toast.success('Rapor başarıyla oluşturuldu');
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

  return (
    <>
      <style jsx global>{`
        #page-content {
          background-color: #f5f7fa;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .sortable-header {
          transition: background-color 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        .sortable-header:hover {
          background-color: rgba(98, 75, 255, 0.1) !important;
        }
        .table-box {
          border-radius: 8px;
          overflow: hidden;
          border: none;
          margin: 0;
        }
        .table-responsive {
          border-radius: 0;
          margin-bottom: 0;
        }
        table {
          margin-bottom: 0;
          table-layout: fixed;
          width: 100%;
        }
        table td, table th {
          padding: 12px 16px;
          vertical-align: middle;
          word-wrap: break-word;
        }
        @media (max-width: 768px) {
          table td, table th {
            padding: 10px 8px;
          }
        }
        table thead tr {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        .page-container {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }
        @media (max-width: 768px) {
          .page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        }
        .table-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .table-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .page-heading-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .page-heading-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>

      <Container fluid className="page-container">
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
                        disabled={isLoading}
                      />
                    </Col>

                    {/* End Date */}
                    <Col md={6} lg={3}>
                      <FormDateField
                        label="Bitiş Tarihi"
                        name="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isLoading}
                      />
                    </Col>

                    {/* Company Select */}
                    <Col md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="fw-500">Şirket</Form.Label>
                        <Form.Select
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          disabled={companiesLoading || isLoading}
                        >
                          <option value="">Tümü</option>
                          {companies.map((company) => (
                            <option key={company.id} value={String(company.id)}>
                              {company.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Department Select */}
                    <Col md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="fw-500">Departman</Form.Label>
                        <Form.Select
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          disabled={departmentsLoading || isLoading}
                        >
                          <option value="">Tümü</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </option>
                          ))}
                        </Form.Select>
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
                        disabled={isLoading}
                      />
                    </Col>

                    {/* Butonlar */}
                    <Col xs={12} className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="primary"
                        onClick={handleGetReport}
                        disabled={isLoading || !startDate || !endDate}
                      >
                        {isLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Rapor Getiriliyor...
                          </>
                        ) : (
                          'Raporu Getir'
                        )}
                      </Button>
                      {showTable && reportData && (
                        <Button
                          variant="success"
                          onClick={handleExportToExcel}
                          disabled={isLoading}
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
                    <LoadingOverlay show={isLoading} message="Rapor hazırlanıyor..." />

                    <Card.Body className="p-0">
                      <div className="table-box">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th
                                  onClick={() => handleSort('first_name')}
                                  className="sortable-header"
                                >
                                  AD {getSortIcon('first_name')}
                                </th>
                                <th
                                  onClick={() => handleSort('last_name')}
                                  className="sortable-header"
                                >
                                  SOYAD {getSortIcon('last_name')}
                                </th>
                                <th
                                  onClick={() => handleSort('identity_no')}
                                  className="sortable-header"
                                >
                                  KİMLİK NO {getSortIcon('identity_no')}
                                </th>
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
                                <th
                                  onClick={() => handleSort('work_days')}
                                  className="sortable-header text-end"
                                >
                                  İŞ GÜNÜ {getSortIcon('work_days')}
                                </th>
                                <th className="text-end">RESMİ TATİL</th>
                                <th className="text-end">KULLANILAN İZİN</th>
                                <th className="text-end">ÇALIŞILAN GÜN</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedAndPaginatedData().length > 0 ? (
                                getSortedAndPaginatedData().map((row: WorkDayReportRow) => (
                                  <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.first_name}</td>
                                    <td>{row.last_name}</td>
                                    <td>{row.identity_no}</td>
                                    <td>{row.company_name}</td>
                                    <td>{row.department_name}</td>
                                    <td>{row.manager || '-'}</td>
                                    <td className="text-end">{Math.round(row.work_days)}</td>
                                    <td className="text-end">{Math.round(row.holiday_days)}</td>
                                    <td className="text-end">{row.used_leave_days.toFixed(1)}</td>
                                    <td className="text-end">{Math.round(row.worked_days)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={11} className="text-center py-4">
                                    Veri bulunamadı
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>

            {getTotalPages() > 1 && !isLoading && (
              <Row className="mt-4">
                <Col lg={12} md={12} sm={12}>
                  <div className="px-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={getTotalPages()}
                      totalItems={reportData.rows?.length || 0}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
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
