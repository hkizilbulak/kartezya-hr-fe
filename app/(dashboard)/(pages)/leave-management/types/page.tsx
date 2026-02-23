"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container } from 'react-bootstrap';
import { leaveTypeService } from '@/services/leave-type.service';
import { LeaveType } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import LeaveTypeModal from '@/components/modals/LeaveTypeModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const LeaveTypesPage = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const fetchLeaveTypes = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC', perPage?: number) => {
    try {
      setIsLoading(true);

      const response = await leaveTypeService.getAll({ 
        page, 
        limit: perPage || itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      if (response.data) {
        setLeaveTypes(response.data);
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
    fetchLeaveTypes(1);
  }, []);

  const handleSort = (key: 'name') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchLeaveTypes(1, key, direction);
  };

  const getSortIcon = (columnKey: 'name') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleAddNew = () => {
    setSelectedLeaveType(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedLeaveType) {
      setDeleteLoading(true);
      try {
        await leaveTypeService.delete(selectedLeaveType.id);
        toast.success('İzin türü başarıyla silindi');
        fetchLeaveTypes(currentPage, sortConfig.key || undefined, sortConfig.direction);
        setShowDeleteModal(false);
        setSelectedLeaveType(null);
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
    fetchLeaveTypes(currentPage, sortConfig.key || undefined, sortConfig.direction);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLeaveType(null);
    setIsEdit(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedLeaveType(null);
  };

  const handlePageChange = (newPage: number) => {
    fetchLeaveTypes(newPage, sortConfig.key || undefined, sortConfig.direction, itemsPerPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    fetchLeaveTypes(1, sortConfig.key || undefined, sortConfig.direction, newPageSize);
  };

  return (
    <>
      <Container fluid className="page-container">
      <LoadingOverlay show={isLoading} message="İzin türleri yükleniyor..." />

        <div className="page-heading-wrapper">
          <PageHeading 
            heading="İzin Türleri"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni İzin Türü"
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
                              onClick={() => handleSort('name')}
                              className="sortable-header"
                            >
                              İzin Türü {getSortIcon('name')}
                            </th>
                            <th>Ücret Durumu</th>
                            <th>Limitli</th>
                            <th>Devredilebilir</th>
                            <th>Belge Gerekli</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveTypes.length ? (
                            leaveTypes.map((leaveType: LeaveType) => (
                              <tr key={leaveType.id}>
                                <td>{leaveType.name}</td>
                                <td>
                                  <span className={`badge ${leaveType.is_paid ? 'bg-info' : 'bg-light text-dark'}`}>
                                    {leaveType.is_paid ? 'Ücretli' : 'Ücretsiz'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${leaveType.is_limited ? 'bg-warning' : 'bg-light text-dark'}`}>
                                    {leaveType.is_limited ? 'Evet' : 'Hayır'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${leaveType.is_accrual ? 'bg-success' : 'bg-light text-dark'}`}>
                                    {leaveType.is_accrual ? 'Evet' : 'Hayır'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${leaveType.is_required_document ? 'bg-danger' : 'bg-light text-dark'}`}>
                                    {leaveType.is_required_document ? 'Evet' : 'Hayır'}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEdit(leaveType)}
                                    disabled={isLoading}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(leaveType)}
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
                                <td colSpan={6} className="text-center py-4">
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

        <LeaveTypeModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleModalSave}
          leaveType={selectedLeaveType}
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

export default LeaveTypesPage;