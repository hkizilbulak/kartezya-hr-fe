"use client";
import { useState, useEffect, type ReactNode } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { GradeReportResponse, GradeReportRow } from '@/models/hr/report.model';
import { OrderedColumnItem } from '@/services/report.service';
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

type GradeGridColumn = {
  key: string;
  label: string;
  visible: boolean;
  sortable?: SortKey;
  className?: string;
  render: (row: GradeReportRow) => ReactNode;
  exportValue: (row: GradeReportRow, index: number) => string | number;
};

const initialColumnsConfig: GradeGridColumn[] = [
  {
    key: 'full_name',
    label: 'AD SOYAD',
    sortable: 'first_name',
    visible: true,
    render: (row) => `${row.first_name} ${row.last_name}`,
    exportValue: (row) => `${row.first_name} ${row.last_name}`
  },
  {
    key: 'hire_date',
    label: 'İŞE GİRİŞ',
    visible: true,
    render: (row) => row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-',
    exportValue: (row) => row.hire_date ? new Date(row.hire_date).toLocaleDateString('tr-TR') : '-'
  },
  {
    key: 'team_start_date',
    label: 'TAKIMA BAŞLANGIÇ',
    visible: true,
    render: (row) => row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-',
    exportValue: (row) => row.team_start_date ? new Date(row.team_start_date).toLocaleDateString('tr-TR') : '-'
  },
  {
    key: 'profession_start_date',
    label: 'MESLEĞE BAŞLANGIÇ',
    visible: true,
    render: (row) => row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-',
    exportValue: (row) => row.profession_start_date ? new Date(row.profession_start_date).toLocaleDateString('tr-TR') : '-'
  },
  {
    key: 'total_experience_text',
    label: 'TOPLAM DENEYİM',
    visible: true,
    render: (row) => row.total_experience_text || '-',
    exportValue: (row) => row.total_experience_text || '-'
  },
  {
    key: 'current_grade',
    label: 'MEVCUT GRADE',
    sortable: 'current_grade',
    visible: true,
    render: (row) => row.current_grade || '-',
    exportValue: (row) => row.current_grade || '-'
  },
  {
    key: 'expected_grade',
    label: 'BEKLENEN GRADE',
    sortable: 'expected_grade',
    visible: true,
    render: (row) => row.expected_grade || '-',
    exportValue: (row) => row.expected_grade || '-'
  },
  {
    key: 'company_name',
    label: 'ŞİRKET',
    sortable: 'company_name',
    visible: true,
    render: (row) => row.company_name,
    exportValue: (row) => row.company_name
  },
  {
    key: 'department_name',
    label: 'DEPARTMAN',
    sortable: 'department_name',
    visible: true,
    render: (row) => row.department_name,
    exportValue: (row) => row.department_name
  },
  {
    key: 'manager',
    label: 'YÖNETİCİ',
    visible: true,
    render: (row) => row.manager || '-',
    exportValue: (row) => row.manager || '-'
  }
];

const GradeReportPage = () => {
  const [reportData, setReportData] = useState<GradeReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Filter state
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [allDepartments, setAllDepartments] = useState<DepartmentLookup[]>([]);
  const [columnsConfig, setColumnsConfig] = useState<GradeGridColumn[]>(initialColumnsConfig);
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const activeColumns = columnsConfig.filter((column) => column.visible);

  const getOrderedColumnsForExport = (): OrderedColumnItem[] => {
    return activeColumns.map((column) => ({ key: column.key, label: column.label }));
  };

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
        selectedDepartmentIds
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
      const orderedColumns = getOrderedColumnsForExport();
      const selectedDeptNumbers = selectedDepartmentIds.map((id) => parseInt(id)).filter((id) => !Number.isNaN(id));

      await reportService.requestGradeReportExport({
        companyId: selectedCompany ? parseInt(selectedCompany) : undefined,
        departmentIds: selectedDeptNumbers,
        orderedColumns,
      });

      await ExcelUtils.exportGradeToExcel(
        reportData,
        activeColumns.map((column) => ({
          key: column.key,
          label: column.label,
          exportValue: (row: GradeReportRow, index: number) => column.exportValue(row, index),
        }))
      );
      toast.success('Rapor Excel\'e başarıyla aktarıldı');
    } catch (error: any) {
      toast.error('Excel export sırasında hata oluştu');
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: SortKey) => {
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

  const handleColumnVisibilityChange = (columnKey: string, isVisible: boolean) => {
    setColumnsConfig((prevColumns) => {
      if (!isVisible && prevColumns.filter((column) => column.visible).length <= 1) {
        return prevColumns;
      }

      return prevColumns.map((column) => (
        column.key === columnKey
          ? { ...column, visible: isVisible }
          : column
      ));
    });
  };

  const handleColumnDrop = (targetKey: string) => {
    if (!draggedColumnKey || draggedColumnKey === targetKey) {
      return;
    }

    setColumnsConfig((prevColumns) => {
      const fromIndex = prevColumns.findIndex((column) => column.key === draggedColumnKey);
      const toIndex = prevColumns.findIndex((column) => column.key === targetKey);

      if (fromIndex < 0 || toIndex < 0) {
        return prevColumns;
      }

      const nextColumns = [...prevColumns];
      const [movedColumn] = nextColumns.splice(fromIndex, 1);
      nextColumns.splice(toIndex, 0, movedColumn);
      return nextColumns;
    });

    setDraggedColumnKey(null);
  };

  const departmentOptions = departments.map((dept) => ({
    value: String(dept.id),
    label: dept.name,
  }));

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

                    {/* Department Multi Select */}
                    <Col md={6} lg={4}>
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

                    {/* Columns */}
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="fw-500">Kolonlar</Form.Label>
                        <div className="d-flex flex-wrap gap-3">
                          {columnsConfig.map((column) => (
                            <Form.Check
                              key={column.key}
                              type="checkbox"
                              id={`column-${column.key}`}
                              label={column.label}
                              checked={column.visible}
                              onChange={(e) => handleColumnVisibilityChange(column.key, e.target.checked)}
                            />
                          ))}
                        </div>
                        <small className="text-muted">Kolonları sürükleyip bırakarak sıralamayı değiştirebilirsiniz.</small>
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
                                {activeColumns.map((column) => (
                                  <th
                                    key={column.key}
                                    draggable
                                    onDragStart={() => setDraggedColumnKey(column.key)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleColumnDrop(column.key)}
                                    onClick={column.sortable ? () => handleSort(column.sortable as SortKey) : undefined}
                                    className={column.sortable ? 'sortable-header' : ''}
                                  >
                                    {column.label} {column.sortable ? getSortIcon(column.sortable as SortKey) : null}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {getSortedAndPaginatedData().length > 0 ? (
                                getSortedAndPaginatedData().map((row: GradeReportRow) => {
                                  const hasGap = row.total_gap > 0;
                                  return (
                                    <tr key={row.id} style={hasGap ? { backgroundColor: '#fff3cd' } : undefined}>
                                      {activeColumns.map((column) => (
                                        <td key={`${row.id}-${column.key}`}>{column.render(row)}</td>
                                      ))}
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={Math.max(activeColumns.length, 1)} className="text-center py-4">
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
