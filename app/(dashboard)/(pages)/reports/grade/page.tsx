"use client";
import { useState, useEffect, type ReactNode } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { GradeReportResponse, GradeReportRow } from '@/models/hr/report.model';
import { CompanyLookup, DepartmentLookup } from '@/services/lookup.service';
import { PageHeading } from '@/widgets';
import FormSelectField from '@/components/FormSelectField';
import MultiSelectField from '@/components/MultiSelectField';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Download as DownloadIcon, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import * as ExcelUtils from '@/helpers/excelExport';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

type SortKey = 'first_name' | 'company_name' | 'department_name' | 'current_grade' | 'expected_grade';

const GradeReportPage = () => {
  const [reportData, setReportData] = useState<GradeReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'ASC' | 'DESC' }>({
    key: null,
    direction: 'ASC',
  });

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setCompaniesLoading(true);
        const [companiesRes, departmentsRes] = await Promise.all([
          lookupService.getCompaniesLookup(),
          lookupService.getDepartmentsLookup(),
        ]);
        if (companiesRes.success && companiesRes.data) setCompanies(companiesRes.data);
        if (departmentsRes.success && departmentsRes.data) {
          setAllDepartments(departmentsRes.data);
          setDepartments([]);
        }
      } catch (error: any) {
        toast.error(translateErrorMessage(error.response?.data?.error || error.message));
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const load = async () => {
        try {
          setDepartmentsLoading(true);
          const response = await lookupService.getDepartmentsByCompanyLookup(parseInt(selectedCompany));
          if (response.success && response.data) {
            setDepartments(response.data);
          } else {
            setDepartments(allDepartments.filter((d: any) => d.company_id && String(d.company_id) === selectedCompany));
          }
        } catch {
          setDepartments(allDepartments.filter((d: any) => d.company_id && String(d.company_id) === selectedCompany));
        } finally {
          setDepartmentsLoading(false);
        }
      };
      load();
      setSelectedDepartmentIds([]);
    } else {
      setDepartments([]);
      setSelectedDepartmentIds([]);
    }
  }, [selectedCompany, allDepartments]);

  const handleGetReport = async () => {
    try {
      setIsLoading(true);
      setShowTable(false);
      const response = await reportService.getGradeReport(
        selectedCompany ? parseInt(selectedCompany) : undefined,
        selectedDepartmentIds,
        isActive,
      );
      setReportData(response);
      setShowTable(true);
      setCurrentPage(1);
    } catch (error: any) {
      toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Rapor çekme sırasında hata oluştu'));
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

  const handleSort = (key: SortKey) => {
    const direction: 'ASC' | 'DESC' =
      sortConfig.key === key && sortConfig.direction === 'ASC' ? 'DESC' : 'ASC';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortKey): ReactNode => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ASC'
      ? <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} />
      : <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const getSortedAndPaginatedData = (): GradeReportRow[] => {
    if (!reportData?.rows) return [];
    let sorted = [...reportData.rows];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const av = a[sortConfig.key as keyof GradeReportRow];
        const bv = b[sortConfig.key as keyof GradeReportRow];
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortConfig.direction === 'ASC' ? av.localeCompare(bv, 'tr-TR') : bv.localeCompare(av, 'tr-TR');
        }
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortConfig.direction === 'ASC' ? av - bv : bv - av;
        }
        return 0;
      });
    }
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  };

  const getTotalPages = () =>
    reportData?.rows ? Math.ceil(reportData.rows.length / itemsPerPage) : 1;

  const departmentOptions = departments.map((dept) => ({
    value: String(dept.id),
    label: dept.name,
  }));

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay
          show={isLoading || companiesLoading}
          message={companiesLoading ? 'Yükleniyor...' : 'Rapor yükleniyor...'}
        />

        <div className="page-heading-wrapper">
          <PageHeading heading="Grade Raporu" showCreateButton={false} showFilterButton={false} />
        </div>

        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="table-wrapper">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Row className="g-3">
                    <Col md={6} lg={3}>
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

                    <Col md={6} lg={3}>
                      <Form.Group>
                        <Form.Label className="fw-500">Departman</Form.Label>
                        <MultiSelectField
                          name="selectedDepartmentIds"
                          value={selectedDepartmentIds}
                          onChange={setSelectedDepartmentIds}
                          options={departmentOptions}
                          disabled={departmentsLoading || !selectedCompany}
                          loading={departmentsLoading}
                          placeholder="Departman seçiniz"
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        id="isActiveCheckboxGrade"
                        label="Sadece Aktif Çalışanlar"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                    </Col>

                    <Col xs={12} className="d-flex gap-2 justify-content-end">
                      <Button variant="primary" onClick={handleGetReport}>
                        Raporu Getir
                      </Button>
                      {showTable && reportData && (
                        <Button variant="success" onClick={handleExportToExcel}>
                          <DownloadIcon size={18} className="me-2" style={{ display: 'inline' }} />
                          Excel&apos;e İndir
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

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
                                <th className="sortable-header" onClick={() => handleSort('first_name')}>
                                  AD SOYAD {getSortIcon('first_name')}
                                </th>
                                <th>İŞE GİRİŞ</th>
                                <th>TAKIMA BAŞLANGIÇ</th>
                                <th>MESLEĞE BAŞLANGIÇ</th>
                                <th>TOPLAM DENEYİM</th>
                                <th className="sortable-header" onClick={() => handleSort('current_grade')}>
                                  MEVCUT GRADE {getSortIcon('current_grade')}
                                </th>
                                <th className="sortable-header" onClick={() => handleSort('expected_grade')}>
                                  BEKLENEN GRADE {getSortIcon('expected_grade')}
                                </th>
                                <th className="sortable-header" onClick={() => handleSort('company_name')}>
                                  ŞİRKET {getSortIcon('company_name')}
                                </th>
                                <th className="sortable-header" onClick={() => handleSort('department_name')}>
                                  DEPARTMAN {getSortIcon('department_name')}
                                </th>
                                <th>YÖNETİCİ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedAndPaginatedData().length > 0 ? (
                                getSortedAndPaginatedData().map((row) => (
                                  <tr
                                    key={row.id}
                                    style={row.total_gap > 0 ? { backgroundColor: '#fff3cd' } : undefined}
                                  >
                                    <td>{row.first_name} {row.last_name}</td>
                                    <td>{row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td>{row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td>{row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td>{row.total_experience_text || '-'}</td>
                                    <td>{row.current_grade || '-'}</td>
                                    <td>{row.expected_grade || '-'}</td>
                                    <td>{row.company_name}</td>
                                    <td>{row.department_name}</td>
                                    <td>{row.manager || '-'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={10} className="text-center py-4">Veri bulunamadı</td>
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

            {reportData.rows && reportData.rows.length > 0 && !isLoading && (
              <Row className="mt-4">
                <Col lg={12} md={12} sm={12}>
                  <div className="px-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={getTotalPages()}
                      totalItems={reportData.rows.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
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
