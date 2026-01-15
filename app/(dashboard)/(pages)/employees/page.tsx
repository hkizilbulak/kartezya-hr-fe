"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge } from 'react-bootstrap';
import { employeeService, ListEmployeesParams } from '@/services';
import { Employee } from '@/models/hr/common.types';
import Pagination from '@/components/Pagination';
import { Plus, Edit, Trash2, Eye, Filter, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import EmployeeModal from '@/components/modals/EmployeeModal';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageData, setPageData] = useState({
    page: 1,
    limit: 10,
    offset: 0,
    total: 0,
    total_pages: 1
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: 'first_name' | 'last_name' | 'email' | 'hire_date' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  // Modal state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);

  // Backend'den verileri çek
  const fetchEmployees = async (page: number = 1, search: string = '', status: string = '', sortKey: string = '', sortDir: 'ASC' | 'DESC' = 'ASC') => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * pageData.limit;
      
      const params: ListEmployeesParams = {
        limit: pageData.limit,
        offset: offset,
        search: search || undefined,
        status: status || undefined,
        sort: sortKey || undefined,
        direction: sortDir
      };

      const response = await employeeService.listWithFilters(params);
      
      if (response.data?.data) {
        setEmployees(response.data.data);
        // Backend response'u 'meta' alanını kullanıyor, 'page' değil
        const meta = response.data.meta || {};
        setPageData({
          page: Math.floor((meta.offset || 0) / (meta.limit || 10)) + 1,
          limit: meta.limit || 10,
          offset: meta.offset || 0,
          total: meta.count || 0,
          total_pages: Math.ceil((meta.count || 0) / (meta.limit || 10))
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filtreleme veya sıralama değiştiğinde backend'e istek at
  const handleSort = (key: 'first_name' | 'last_name' | 'email' | 'hire_date') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchEmployees(1, searchFilter, statusFilter, key, direction);
  };

  // Arama filtresi değiştiğinde backend'e istek at
  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    fetchEmployees(1, value, statusFilter, sortConfig.key || '', sortConfig.direction);
  };

  // Durum filtresi değiştiğinde backend'e istek at
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    fetchEmployees(1, searchFilter, value, sortConfig.key || '', sortConfig.direction);
  };

  // Sayfa değiştiğinde backend'e istek at
  const handlePageChange = (newPage: number) => {
    fetchEmployees(newPage, searchFilter, statusFilter, sortConfig.key || '', sortConfig.direction);
  };

  const getSortIcon = (columnKey: 'first_name' | 'last_name' | 'email' | 'hire_date') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleView = (employee: Employee) => {
    console.log('View employee:', employee);
    // TODO: Implement view modal
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditingEmployee(true);
    setShowEmployeeModal(true);
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
    setShowEmployeeModal(true);
  };

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
    setIsEditingEmployee(false);
  };

  const handleSaveEmployee = () => {
    // Refresh the employee list
    fetchEmployees(pageData.page, searchFilter, statusFilter, sortConfig.key || '', sortConfig.direction);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      try {
        await employeeService.delete(id);
        toast.success('Çalışan başarıyla silindi');
        fetchEmployees(pageData.page, searchFilter, statusFilter, sortConfig.key || '', sortConfig.direction);
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
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'ACTIVE' ? 'success' : status === 'INACTIVE' ? 'warning' : 'danger';
    const text = status === 'ACTIVE' ? 'Aktif' : status === 'INACTIVE' ? 'Pasif' : 'Sonlandırıldı';
    return <Badge bg={variant}>{text}</Badge>;
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
        table thead tr {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        table thead tr:last-child td {
          padding: 12px 16px;
          background-color: white;
          border-bottom: none;
        }
        table thead tr:last-child .filter-input {
          width: 100%;
        }
      `}</style>

      <Row className="mb-4 px-3 pt-4">
        <Col lg={12} md={12} sm={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Çalışanlar</h4>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                <Filter size={16} />
              </Button>
              
              <Button variant="primary" size="sm" disabled={isLoading} onClick={handleAddNew}>
                <Plus size={16} className="me-1" />
                Yeni Çalışan
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="px-3">
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
                          <th
                            onClick={() => handleSort('email')}
                            className="sortable-header"
                          >
                            E-posta {getSortIcon('email')}
                          </th>
                          <th>Telefon</th>
                          <th
                            onClick={() => handleSort('hire_date')}
                            className="sortable-header"
                          >
                            İşe Başlama {getSortIcon('hire_date')}
                          </th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                        {showFilters && (
                          <tr>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                              <Form.Control
                                type="text"
                                placeholder="Ad, Soyad..."
                                value={searchFilter}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="filter-input"
                                size="sm"
                                disabled={isLoading}
                              />
                            </td>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                              <Form.Select
                                value={statusFilter}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                size="sm"
                                disabled={isLoading}
                              >
                                <option value="">Tümü</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="INACTIVE">Pasif</option>
                                <option value="TERMINATED">Sonlandırıldı</option>
                              </Form.Select>
                            </td>
                            <td className="border-top">
                            </td>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {employees.length ? (
                          employees.map((employee: Employee) => (
                            <tr key={employee.id}>
                              <td>{employee.id}</td>
                              <td>{employee.firstName} {employee.lastName}</td>
                              <td>{employee.email}</td>
                              <td>{employee.phone || '-'}</td>
                              <td>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('tr-TR') : '-'}</td>
                              <td>{getStatusBadge(employee.status)}</td>
                              <td>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleView(employee)}
                                  disabled={isLoading}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(employee)}
                                  disabled={isLoading}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(employee.id)}
                                  disabled={isLoading}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              {isLoading ? 'Yükleniyor...' : 'Veri bulunamadı'}
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

      {!isLoading && (
        <Row className="mt-4">
          <Col lg={12} md={12} sm={12}>
            <div className="px-3">
              <Pagination
                currentPage={pageData.page}
                totalPages={pageData.total_pages}
                totalItems={pageData.total}
                itemsPerPage={pageData.limit}
                onPageChange={handlePageChange}
              />
            </div>
          </Col>
        </Row>
      )}

      <EmployeeModal
        show={showEmployeeModal}
        onHide={handleCloseEmployeeModal}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
        isEdit={isEditingEmployee}
      />
    </>
  );
};

export default EmployeesPage;