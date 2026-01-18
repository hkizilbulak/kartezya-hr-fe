"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import { leaveTypeService } from '@/services/leave-type.service';
import { LeaveType } from '@/models/hr/common.types';
import Pagination from '@/components/Pagination';
import LeaveTypeModal from '@/components/modals/LeaveTypeModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';

const LeaveTypesPage = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | null;
    direction: 'ASC' | 'DESC';
  }>({
    key: null,
    direction: 'ASC'
  });

  const fetchLeaveTypes = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC') => {
    try {
      setIsLoading(true);

      const response = await leaveTypeService.getAll({ 
        page, 
        size: itemsPerPage,
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
    fetchLeaveTypes(newPage, sortConfig.key || undefined, sortConfig.direction);
  };

  return (
    <>
      <Row className="mb-4 px-3 pt-4">
        <Col lg={12} md={12} sm={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">İzin Türleri</h4>
            <div className="d-flex gap-2">
              <Button variant="primary" size="sm" onClick={handleAddNew} disabled={isLoading}>
                <Plus size={16} className="me-1" />
                Yeni
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="px-3">
            <Card className="border-0 shadow-sm position-relative">
              <LoadingOverlay show={isLoading} message="İzin türleri yükleniyor..." />

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
                          <th></th>
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

      {totalPages > 1 && !isLoading && (
        <Row className="mt-4">
          <Col lg={12} md={12} sm={12}>
            <div className="px-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
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
    </>
  );
};

export default LeaveTypesPage;