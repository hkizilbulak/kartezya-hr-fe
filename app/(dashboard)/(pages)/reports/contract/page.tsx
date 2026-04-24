"use client";
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { reportService, lookupService } from '@/services';
import { ContractReportResponse, ContractReportRow } from '@/models/hr/report.model';
import { CompanyLookup, DepartmentLookup } from '@/services/lookup.service';
import { PageHeading } from '@/widgets';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import MultiSelectField from '@/components/MultiSelectField';
import LoadingOverlay from '@/components/LoadingOverlay';
import Pagination from '@/components/Pagination';
import { Download as DownloadIcon, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const ContractReportPage = () => {
    const [reportData, setReportData] = useState<ContractReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTable, setShowTable] = useState(false);

    // Filter state
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [companies, setCompanies] = useState<CompanyLookup[]>([]);
    const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('active');

    // UI state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    const statusOptions = [
        { value: 'active', label: 'Aktif Çalışanlar' },
        { value: 'inactive', label: 'Eski Çalışanlar' },
        { value: 'all', label: 'Tümü' }
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const compsRes = await lookupService.getCompaniesLookup();
                if (compsRes.success && compsRes.data) {
                    setCompanies(compsRes.data);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                toast.error('Filtre verileri yüklenirken hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchDepartments = async () => {
            if (selectedCompany) {
                try {
                    const depsRes = await lookupService.getDepartmentsByCompanyLookup(Number(selectedCompany));
                    if (depsRes.success && depsRes.data) {
                        setDepartments(depsRes.data);
                    }
                    setSelectedDepartmentIds([]);
                } catch (error) {
                    console.error('Error fetching departments:', error);
                    toast.error('Departmanlar yüklenirken hata oluştu');
                }
            } else {
                setDepartments([]);
                setSelectedDepartmentIds([]);
            }
        };

        fetchDepartments();
    }, [selectedCompany]);

    const handleGenerateReport = async () => {
        try {
            setIsLoading(true);

            let isActive: boolean | undefined = undefined;
            if (selectedStatus === 'active') isActive = true;
            if (selectedStatus === 'inactive') isActive = false;

            const filter = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                companyId: selectedCompany ? Number(selectedCompany) : undefined,
                departmentIds: selectedDepartmentIds.length > 0 ? selectedDepartmentIds : undefined,
                isActive
            };

            const data = await reportService.getContractReport(filter);
            setReportData(data);
            setShowTable(true);
            setCurrentPage(1);
            setIsFilterOpen(false);
            toast.success('Rapor başarıyla oluşturuldu');
        } catch (error: any) {
            console.error('Error generating report:', error);
            const errorMessage = translateErrorMessage(error?.response?.data?.error || error.message);
            toast.error(`Rapor oluşturulurken hata oluştu: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedCompany('');
        setSelectedDepartmentIds([]);
        setSelectedStatus('active');
        setShowTable(false);
        setReportData(null);
        setCurrentPage(1);
    };

    const handleExportExcel = async () => {
        try {
            setIsLoading(true);
            
            let isActive: boolean | undefined = undefined;
            if (selectedStatus === 'active') isActive = true;
            if (selectedStatus === 'inactive') isActive = false;

            const columns = [
                { key: 'fullName', label: 'Ad Soyad' },
                { key: 'contractNames', label: 'Sözleşmeler' },
                { key: 'companyName', label: 'Şirket' },
                { key: 'departmentName', label: 'Departman' },
                { key: 'manager', label: 'Yönetici' }
            ];

            await reportService.downloadContractReportExcel({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                companyId: selectedCompany ? Number(selectedCompany) : undefined,
                departmentIds: selectedDepartmentIds.length > 0 ? selectedDepartmentIds : undefined,
                columns
            });
            toast.success('Excel başarıyla indirildi');
        } catch (error: any) {
            console.error('Error exporting excel:', error);
            toast.error('Excel indirilirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate pagination
    const totalItems = reportData?.rows?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentRows = reportData?.rows?.slice(startIndex, endIndex) || [];

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <Container fluid className="page-container">
            <LoadingOverlay show={isLoading} />
            <div className="page-heading-wrapper">
              <PageHeading heading="Sözleşme Raporu" showCreateButton={false} showFilterButton={false} />
            </div>

            {/* Filtreleme Kartı */}
            <Row>
              <Col lg={12} md={12} sm={12}>
                <div className="table-wrapper">
                  <Card className="mb-4 border-0 shadow-sm">
                    <Card.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6} lg={3}>
                                <FormDateField
                                    label="Başlangıç Tarihi"
                                    name="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <FormDateField
                                    label="Bitiş Tarihi"
                                    name="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-500">Şirket</Form.Label>
                                    <FormSelectField
                                        name="company"
                                        value={selectedCompany}
                                        onChange={(e) => setSelectedCompany(e.target.value)}
                                    >
                                        <option value="">Şirket Seçin</option>
                                        {companies.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                    </FormSelectField>
                                </Form.Group>
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-500">Departman</Form.Label>
                                    <MultiSelectField
                                        name="department"
                                        options={departments.map(d => ({ value: String(d.id), label: d.name || '' }))}
                                        value={selectedDepartmentIds.map(String)}
                                        onChange={(vals) => setSelectedDepartmentIds(vals.map(Number))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-500">Durum</Form.Label>
                                    <FormSelectField
                                        name="status"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </FormSelectField>
                                </Form.Group>
                            </Col>
                            
                            {/* Butonlar */}
                            <Col xs={12} className="d-flex gap-2 justify-content-end">
                                <Button 
                                    variant="primary" 
                                    onClick={handleGenerateReport}
                                >
                                    Raporu Getir
                                </Button>
                                {showTable && reportData && (
                                    <Button 
                                        variant="success" 
                                        onClick={handleExportExcel}
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

            {showTable && reportData && (
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
                                                    <th className="sortable-header">AD SOYAD</th>
                                                    <th className="sortable-header">SÖZLEŞMELER</th>
                                                    <th className="sortable-header">ŞİRKET</th>
                                                    <th className="sortable-header">DEPARTMAN</th>
                                                    <th className="sortable-header">YÖNETİCİ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentRows.length > 0 ? (
                                                    currentRows.map((row: ContractReportRow, idx: number) => (
                                                        <tr key={row.id || idx}>
                                                            <td>{row.first_name} {row.last_name}</td>
                                                            <td>{row.contract_names}</td>
                                                            <td>{row.company_name}</td>
                                                            <td>{row.department_name}</td>
                                                            <td>{row.manager}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-4">
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
            )}
            
            {showTable && reportData && totalItems > 0 && (
                <Row className="mt-4">
                    <Col lg={12} md={12} sm={12}>
                        <div className="px-3">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={(sz: number) => { }}
                                />
                        </div>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default ContractReportPage;
