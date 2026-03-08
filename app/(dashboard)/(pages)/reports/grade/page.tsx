"use client";
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { GradeReportResponse, GradeReportRow } from '@/models/hr/report.model';
import { CompanyLookup, DepartmentLookup } from '@/services/lookup.service';
import { PageHeading } from '@/widgets';
import FormSelectField from '@/components/FormSelectField';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Download as DownloadIcon, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import * as ExcelUtils from '@/helpers/excelExport';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const GradeReportPage = () => {
  const [reportData, setReportData] = useState<GradeReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Filter state
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: 'first_name' | 'last_name' | 'company_name' | 'department_name' | 'total_gap' | 'current_grade' | 'expected_grade' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

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
    try {
      setIsLoading(true);
      setShowTable(false);

      const response = await reportService.getGradeReport(
        selectedCompany ? parseInt(selectedCompany) : undefined,
        selectedDepartment ? parseInt(selectedDepartment) : undefined
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
      await ExcelUtils.exportGradeToExcel(reportData);
      toast.success('Rapor Excel\'e başarıyla aktarıldı');
    } catch (error: any) {
      toast.error('Excel export sırasında hata oluştu');
    }
  };

  const handleSort = (key: 'first_name' | 'last_name' | 'company_name' | 'department_name' | 'total_gap' | 'current_grade' | 'expected_grade') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: 'first_name' | 'last_name' | 'company_name' | 'department_name' | 'total_gap' | 'current_grade' | 'expected_grade') => {
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
        const aValue = a[sortConfig.key as keyof GradeReportRow];
        const bValue = b[sortConfig.key as keyof GradeReportRow];

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
    setCurrentPage(1);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading || companiesLoading} message={companiesLoading ? "Yükleniyor..." : "Rapor yükleniyor..."} />
        
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Grade Raporu"
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
                    {/* Company Select */}
                    <Col md={6} lg={4}>
                      <Form.Group>
                        <Form.Label className="fw-500">Şirket</Form.Label>
                        <FormSelectField
                          name="selectedCompany"
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          disabled={companiesLoading}
                        >
                          <option value="">Tüm Şirketler</option>
                          {companies.map((company) => (
                            <option key={company.id} value={String(company.id)}>
                              {company.name}
                            </option>
                          ))}
                        </FormSelectField>
                      </Form.Group>
                    </Col>

                    {/* Department Select */}
                    <Col md={6} lg={4}>
                      <Form.Group>
                        <Form.Label className="fw-500">Departman</Form.Label>
                        <FormSelectField
                          name="selectedDepartment"
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          disabled={departmentsLoading || !selectedCompany}
                        >
                          <option value="">Tüm Departmanlar</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </option>
                          ))}
                        </FormSelectField>
                      </Form.Group>
                    </Col>

                    {/* Butonlar */}
                    <Col xs={12} className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="primary"
                        onClick={handleGetReport}
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
                                <th>İŞE GİRİŞ</th>
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
                                <th>TAKIMA BAŞLANGIÇ</th>
                                <th>MESLEĞE BAŞLANGIÇ</th>
                                <th>TOPLAM DENEYİM</th>
                                <th
                                  onClick={() => handleSort('current_grade')}
                                  className="sortable-header"
                                >
                                  MEVCUT GRADE {getSortIcon('current_grade')}
                                </th>
                                <th
                                  onClick={() => handleSort('expected_grade')}
                                  className="sortable-header"
                                >
                                  BEKLENEN GRADE {getSortIcon('expected_grade')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedAndPaginatedData().length > 0 ? (
                                getSortedAndPaginatedData().map((row: GradeReportRow) => {
                                  const hasGap = row.total_gap > 0;
                                  return (
                                    <tr key={row.id} style={hasGap ? { backgroundColor: '#fff3cd' } : undefined}>
                                      <td>{row.id}</td>
                                      <td>{row.first_name} {row.last_name}</td>
                                      <td>{row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-'}</td>
                                      <td>{row.company_name}</td>
                                      <td>{row.department_name}</td>
                                      <td>{row.manager || '-'}</td>
                                      <td>{row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-'}</td>
                                      <td>{row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-'}</td>
                                      <td>{row.total_experience_text || '-'}</td>
                                      <td>{row.current_grade || '-'}</td>
                                      <td>{row.expected_grade || '-'}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={11} className="text-center py-4">
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

export default GradeReportPage;
