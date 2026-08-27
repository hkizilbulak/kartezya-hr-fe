'use client';

import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Spinner, Row, Col, Form, Button } from 'react-bootstrap';
import { Monitor, Search, Download } from 'react-feather';
import { InventoryItem, InventoryItemStatus } from '@/models/hr/hr-models';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-toastify';
import CustomPagination from '@/components/Pagination';
import FormSelectField from '@/components/FormSelectField';
import ExcelJS from 'exceljs';

const InventoryReportPage = () => {
  const [items, setItems] = useState<any[]>([]); // Using any for now to handle nested employee object
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    device_type: [] as string[],
    status: [] as string[],
    search: '',
  });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      // We will need a generic search endpoint for all inventory items
      const response = await inventoryService.getInventoryReport({
        page,
        limit,
        search: filters.search,
        device_type: filters.device_type.join(','),
        status: filters.status.join(','),
      });
      setItems(response.data || []);
      setTotalItems(response.page?.total || 0);
      setTotalPages(response.page?.total_pages || 1);
    } catch (error: any) {
      toast.error('Envanter bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleClearFilters = () => {
    const defaultFilters = { device_type: [], status: [], search: '' };
    setFilters(defaultFilters);
    setPage(1);
    
    setIsLoading(true);
    inventoryService.getInventoryReport({
      page: 1,
      limit,
      search: '',
      device_type: '',
      status: '',
    }).then(response => {
      setItems(response.data || []);
      setTotalItems(response.page?.total || 0);
      setTotalPages(response.page?.total_pages || 1);
    }).catch(() => {
      toast.error('Envanter bilgileri yüklenemedi.');
    }).finally(() => setIsLoading(false));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = async () => {
    if (items.length === 0) return;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Envanter Raporu');
    
    worksheet.columns = [
      { header: 'Çalışan', key: 'employee', width: 25 },
      { header: 'Çalıştığı Şirket', key: 'company', width: 20 },
      { header: 'Cihaz Türü', key: 'device_type', width: 20 },
      { header: 'Marka', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Seri No', key: 'serial_number', width: 25 },
      { header: 'Zimmet Tarihi', key: 'assignment_date', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Notlar', key: 'notes', width: 30 }
    ];

    items.forEach(item => {
      worksheet.addRow({
        employee: item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : 'Atanmamış',
        company: item.employee?.work_information?.company_name || item.employee?.employee_work_information?.[0]?.company?.name || '-',
        device_type: item.device_type,
        brand: item.brand,
        model: item.model,
        serial_number: item.serial_number || '-',
        assignment_date: item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-',
        status: getStatusText(item.status),
        notes: item.notes || '-'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Envanter_Raporu_${new Date().toLocaleDateString('tr-TR')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case InventoryItemStatus.IN_USE: return 'success';
      case InventoryItemStatus.IN_STOCK: return 'info';
      case InventoryItemStatus.DAMAGED: return 'danger';
      case InventoryItemStatus.RETURNED: return 'secondary';
      default: return 'primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case InventoryItemStatus.IN_USE: return 'Kullanımda';
      case InventoryItemStatus.IN_STOCK: return 'Stokta';
      case InventoryItemStatus.DAMAGED: return 'Arızalı';
      case InventoryItemStatus.RETURNED: return 'İade Edildi';
      default: return status;
    }
  };

  return (
    <Container fluid className="px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Monitor size={24} className="me-2 text-primary" />
          <h4 className="mb-0">Envanter Raporu</h4>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={6} lg={4}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">Arama</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seri no, çalışan vb."
                    name="search"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={4}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">Cihaz Türü</Form.Label>
                  <FormSelectField
                    name="device_type"
                    isMultiSelect={true}
                    value={filters.device_type}
                    onChange={(e: any) => setFilters(prev => ({ ...prev, device_type: e.target.value }))}
                    placeholder="Cihaz türü seçiniz"
                  >
                    <option value="Laptop">Laptop / Bilgisayar</option>
                    <option value="Monitor">Monitör</option>
                    <option value="Phone">Cep Telefonu</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Other">Diğer</option>
                  </FormSelectField>
                </Form.Group>
              </Col>
              <Col md={6} lg={4}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">Durum</Form.Label>
                  <FormSelectField
                    name="status"
                    isMultiSelect={true}
                    value={filters.status}
                    onChange={(e: any) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    placeholder="Durum seçiniz"
                  >
                    <option value={InventoryItemStatus.IN_USE}>Kullanımda</option>
                    <option value={InventoryItemStatus.IN_STOCK}>Stokta</option>
                    <option value={InventoryItemStatus.DAMAGED}>Arızalı</option>
                    <option value={InventoryItemStatus.RETURNED}>İade Edildi</option>
                  </FormSelectField>
                </Form.Group>
              </Col>

              <Col xs={12} className="d-flex gap-2 justify-content-end mt-4">
                <Button variant="secondary" onClick={handleClearFilters}>
                  Temizle
                </Button>
                <Button type="submit" variant="primary">
                  <Search size={16} className="me-2" style={{ display: 'inline' }} />
                  Raporu Getir
                </Button>
                {items.length > 0 && (
                  <Button variant="success" onClick={handleExport}>
                    <Download size={18} className="me-2" style={{ display: 'inline' }} />
                    Excel'e İndir
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">Rapor kriterlerine uygun cihaz bulunamadı.</p>
            </div>
          ) : (
            <>
              <Table responsive className="table-list mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Çalışan</th>
                    <th>Çalıştığı Şirket</th>
                    <th>Cihaz Türü</th>
                    <th>Marka / Model</th>
                    <th>Seri No</th>
                    <th>Zimmet Tarihi</th>
                    <th className="pe-4">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4">
                        {item.employee ? (
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                              <span className="fw-bold" style={{ fontSize: '0.8rem' }}>
                                {item.employee.first_name.charAt(0)}{item.employee.last_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="fw-medium text-dark">{item.employee.first_name} {item.employee.last_name}</div>
                              {item.employee.department && <div className="text-muted small">{item.employee.department.name}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Atanmamış</span>
                        )}
                      </td>
                      <td>{item.employee?.work_information?.company_name || item.employee?.employee_work_information?.[0]?.company?.name || '-'}</td>
                      <td>{item.device_type}</td>
                      <td>{item.brand} {item.model}</td>
                      <td>{item.serial_number || '-'}</td>
                      <td>{item.assignment_date ? new Date(item.assignment_date).toLocaleDateString('tr-TR') : '-'}</td>
                      <td className="pe-4">
                        <Badge bg={getStatusBadgeVariant(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {totalPages > 1 && (
                <div className="p-3 border-top">
                  <CustomPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={limit}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventoryReportPage;
