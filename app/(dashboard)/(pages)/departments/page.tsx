"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import { departmentService } from '@/services';
import { Department } from '@/models/hr/common.types';
import Pagination from '@/components/Pagination';
import DepartmentModal from '@/components/modals/DepartmentModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Filter } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const [pageData, setPageData] = useState({
    page: 1,
    limit: 10,
    offset: 0,
    total: 0,
    total_pages: 1
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'manager' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  // Backend'den verileri çek
  const fetchDepartments = async (page: number = 1, search: string = '', sortKey: string = '', sortDir: 'ASC' | 'DESC' = 'ASC') => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * pageData.limit;
      
      const response = await departmentService.getAll({ 
        page, 
        size: pageData.limit,
        search: search || undefined,
        sort: sortKey || undefined,
        direction: sortDir
      });
      
      if (response.data) {
        setDepartments(response.data);
        setPageData({
          page: response.page?.page || 1,
          limit: response.page?.limit || 10,
          offset: 0,
          total: response.page?.total || 0,
          total_pages: response.page?.total_pages || 1
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
    fetchDepartments();
  }, []);

  const handleSort = (key: 'name' | 'manager') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchDepartments(1, searchFilter, key, direction);
  };

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    fetchDepartments(1, value, sortConfig.key || '', sortConfig.direction);
  };

  const getSortIcon = (columnKey: 'name' | 'manager') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleAddNew = () => {
    setSelectedDepartment(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedDepartment) {
      setDeleteLoading(true);
      try {
        await departmentService.delete(selectedDepartment.id);
        toast.success('Departman başarıyla silindi');
        fetchDepartments(pageData.page, searchFilter, sortConfig.key || '', sortConfig.direction);
        setShowDeleteModal(false);
        setSelectedDepartment(null);
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
    fetchDepartments(pageData.page, searchFilter, sortConfig.key || '', sortConfig.direction);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDepartment(null);
    setIsEdit(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedDepartment(null);
  };

  const handlePageChange = (newPage: number) => {
    fetchDepartments(newPage, searchFilter, sortConfig.key || '', sortConfig.direction);
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
            <h4 className="mb-0">Departmanlar</h4>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                <Filter size={16} />
              </Button>
              
              <Button variant="primary" size="sm" onClick={handleAddNew} disabled={isLoading}>
                <Plus size={16} className="me-1" />
                Yeni Departman
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="px-3">
            <Card className="border-0 shadow-sm position-relative">
              <LoadingOverlay show={isLoading} message="Departmanlar yükleniyor..." />
              
              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Şirket</th>
                          <th 
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                          >
                            Departman Adı {getSortIcon('name')}
                          </th>
                          <th 
                            onClick={() => handleSort('manager')}
                            className="sortable-header"
                          >
                            Yönetici {getSortIcon('manager')}
                          </th>
                          <th>İşlemler</th>
                        </tr>
                        {showFilters && (
                          <tr>
                            <td className="border-top">
                            </td>
                            <td className="border-top">
                              <Form.Control
                                type="text"
                                placeholder="Departman adı, yönetici..."
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
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {departments.length ? (
                          departments.map((department: Department) => (
                            <tr key={department.id}>
                              <td>{department.company?.name || '-'}</td>
                              <td>{department.name}</td>
                              <td>{department.manager || '-'}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(department)}
                                  disabled={isLoading}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(department)}
                                  disabled={isLoading}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          !isLoading && (
                            <tr>
                              <td colSpan={4} className="text-center py-4">
                                Veri bulunamadı
                              </td>
                            </tr>
                          )
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

      <DepartmentModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        department={selectedDepartment}
        isEdit={isEdit}
      />

      {showDeleteModal && (
        <DeleteModal
          onClose={handleCloseDeleteModal}
          onHandleDelete={handleDelete}
          loading={deleteLoading}
        />
      )}
    </>
  );
};

export default DepartmentsPage;