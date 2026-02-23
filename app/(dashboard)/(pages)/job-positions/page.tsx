"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container } from 'react-bootstrap';
import { jobPositionService } from '@/services';
import { JobPosition } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import JobPositionModal from '@/components/modals/JobPositionModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const JobPositionsPage = () => {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState<{
    key: 'title' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const fetchPositions = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC', perPage?: number) => {
    try {
      setIsLoading(true);
      
      const response = await jobPositionService.getAll({ 
        page, 
        limit: perPage || itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      if (response.data) {
        setPositions(response.data);
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
    fetchPositions(1);
  }, []);

  const handleSort = (key: 'title') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchPositions(1, key, direction);
  };

  const getSortIcon = (columnKey: 'title') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleAddNew = () => {
    setSelectedPosition(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (position: JobPosition) => {
    setSelectedPosition(position);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (position: JobPosition) => {
    setSelectedPosition(position);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedPosition) {
      setDeleteLoading(true);
      try {
        await jobPositionService.delete(selectedPosition.id);
        toast.success('Pozisyon başarıyla silindi');
        fetchPositions(currentPage, sortConfig.key || undefined, sortConfig.direction);
        setShowDeleteModal(false);
        setSelectedPosition(null);
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
    fetchPositions(currentPage, sortConfig.key || undefined, sortConfig.direction);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPosition(null);
    setIsEdit(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedPosition(null);
  };

  const handlePageChange = (newPage: number) => {
    fetchPositions(newPage, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    fetchPositions(1, sortConfig.key || undefined, sortConfig.direction, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Pozisyonlar yükleniyor..." />
        
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Pozisyonlar"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni Pozisyon"
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
                              onClick={() => handleSort('title')}
                              className="sortable-header"
                            >
                              Pozisyon Adı {getSortIcon('title')}
                            </th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.length ? (
                            positions.map((position: JobPosition) => (
                              <tr key={position.id}>
                                <td>{position.title}</td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEdit(position)}
                                    disabled={isLoading}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(position)}
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
                                <td colSpan={2} className="text-center py-4">
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

        <JobPositionModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleModalSave}
          jobPosition={selectedPosition}
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

export default JobPositionsPage;