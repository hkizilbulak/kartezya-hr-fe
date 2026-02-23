"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container } from 'react-bootstrap';
import { departmentService } from '@/services';
import { Department } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import DepartmentModal from '@/components/modals/DepartmentModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState<{
    key: 'company' | 'name' | 'manager' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const fetchDepartments = async (page: number = 1, sortKey: string = "company", sortDir?: 'ASC' | 'DESC', perPage?: number) => {
    try {
      setIsLoading(true);
      
      const response = await departmentService.getAll({ 
        page, 
        limit: perPage || itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      if (response.data) {
        setDepartments(response.data);
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
    fetchDepartments(1);
  }, []);

  const handleSort = (key: 'company' | 'name' | 'manager') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchDepartments(1, key, direction);
  };

  const getSortIcon = (columnKey: 'company' | 'name' | 'manager') => {
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
        fetchDepartments(currentPage, sortConfig.key || undefined, sortConfig.direction);
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
    fetchDepartments(currentPage, sortConfig.key || undefined, sortConfig.direction);
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
    fetchDepartments(newPage, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    fetchDepartments(1, sortConfig.key || undefined, sortConfig.direction, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Departmanlar yükleniyor..." />

        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Departmanlar"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni Departman"
            onCreate={handleAddNew}
          />
        </div>

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
                            <th 
                              onClick={() => handleSort('company')}
                              className="sortable-header"
                            >
                              Şirket {getSortIcon('company')}
                            </th>
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
                            <th></th>
                          </tr>
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
      </Container>
    </>
  );
};

export default DepartmentsPage;