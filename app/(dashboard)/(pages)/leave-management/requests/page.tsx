"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { LeaveRequest } from '@/models/hr/common.types';
import LeaveRequestModal from '@/components/modals/LeaveRequestModal';
import Pagination from '@/components/Pagination';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Check, X, Edit, ChevronUp, ChevronDown, Plus } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';

const LeaveRequestsPage = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRequest, setCancelRequest] = useState<LeaveRequest | null>(null);

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

  const fetchLeaveRequests = async (page: number = 1, sortKey?: string, sortDir?: 'ASC' | 'DESC') => {
    try {
      setIsLoading(true);

      const response = await leaveRequestService.getAll({ 
        page, 
        size: itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      console.log('Leave Requests Response:', response);
      
      if (response.data) {
        setLeaveRequests(response.data);
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
    fetchLeaveRequests(1);
  }, []);

  const handleSort = (key: 'name') => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    fetchLeaveRequests(1, key, direction);
  };

  const getSortIcon = (columnKey: 'name') => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleApprove = async (request: LeaveRequest) => {
    setActionLoading(true);
    try {
      await leaveRequestService.approveLeaveRequest(request.id, { approvedBy: 0 });
      fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Onaylama sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Red nedeni boş olamaz');
      return;
    }

    setActionLoading(true);
    try {
      await leaveRequestService.rejectLeaveRequest(selectedRequest.id, { 
        rejectionReason: rejectReason 
      });
      fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Red işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = (request: LeaveRequest) => {
    setCancelRequest(request);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelRequest) return;
    
    setActionLoading(true);
    try {
      // Backend CancelLeaveRequest struct'ında reason required
      await leaveRequestService.cancelLeaveRequest(cancelRequest.id, {
        reason: 'İzin talebi iptal edildi'
      });
      toast.success('İzin talebi iptal edildi');
      fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
      setShowCancelModal(false);
      setCancelRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'İptal işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (request: LeaveRequest) => {
    handleCancelClick(request);
  };

  const handlePageChange = (newPage: number) => {
    fetchLeaveRequests(newPage, sortConfig.key || undefined, sortConfig.direction);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning">Bekliyor</span>;
      case 'APPROVED':
        return <span className="badge bg-success">Onaylandı</span>;
      case 'REJECTED':
        return <span className="badge bg-danger">Reddedildi</span>;
      case 'CANCELLED':
        return <span className="badge bg-secondary">İptal Edildi</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch (error) {
      return '-';
    }
  };

  const handleAddNew = () => {
    setSelectedRequest(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (request: LeaveRequest) => {
    console.log('Edit clicked - Request object:', JSON.stringify(request, null, 2));
    
    // Tablo verilerinden employee ve leave_type bilgisini al
    const enrichedRequest = {
      ...request,
      employee_id: request.employee_id || request.employeeId || (request.employee as any)?.id,
      leave_type_id: request.leave_type_id || request.leaveTypeId || (request.leave_type as any)?.id
    };
    
    console.log('Enriched request:', enrichedRequest);
    setSelectedRequest(enrichedRequest);
    setIsEdit(true);
    setShowModal(true);
    
    // Detay bilgisini API'den çek
    fetchLeaveRequestDetails(request.id);
  };

  const fetchLeaveRequestDetails = async (id: number) => {
    try {
      const response = await leaveRequestService.getById(id);
      if (response.data) {
        console.log('Fetched leave request details - Full object:', JSON.stringify(response.data, null, 2));
        console.log('Fetched leave request - Keys:', Object.keys(response.data));
        setSelectedRequest(response.data);
      }
    } catch (error) {
      console.error('Error fetching leave request details:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setIsEdit(false);
  };

  const handleModalSave = () => {
    fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
  };

  return (
    <>
      <Row className="mb-4 px-3 pt-4">
        <Col lg={12} md={12} sm={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">İzin Talepleri</h4>
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
              <LoadingOverlay show={isLoading} message="İzin talepleri yükleniyor..." />

              <Card.Body className="p-0">
                <div className="table-box">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Çalışan Adı</th>
                          <th>İzin Türü</th>
                          <th>Başlangıç Tarihi</th>
                          <th>Bitiş Tarihi</th>
                          <th>Kullanılan Gün</th>
                          <th>Durum</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests.length ? (
                          leaveRequests.map((request: LeaveRequest) => {
                            const empFirstName = request.employee?.first_name || request.employee?.firstName;
                            const empLastName = request.employee?.last_name || request.employee?.lastName;
                            const leaveTypeName = request.leave_type?.name || request.leaveType?.name;
                            const startDate = request.start_date || request.startDate;
                            const endDate = request.end_date || request.endDate;
                            const requestedDays = request.requested_days || request.requestedDays;

                            return (
                              <tr key={request.id}>
                                <td>
                                  {empFirstName} {empLastName}
                                </td>
                                <td>{leaveTypeName}</td>
                                <td>{formatDate(startDate)}</td>
                                <td>{formatDate(endDate)}</td>
                                <td>{requestedDays || '-'}</td>
                                <td>{getStatusBadge(request.status)}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    {request.status === 'PENDING' && (
                                      <>
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          title="Onayla"
                                          onClick={() => handleApprove(request)}
                                          disabled={isLoading || actionLoading}
                                        >
                                          <Check size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          title="Reddet"
                                          onClick={() => handleRejectClick(request)}
                                          disabled={isLoading || actionLoading}
                                        >
                                          <X size={14} />
                                        </Button>
                                      </>
                                    )}
                                    {request.status === 'PENDING' && (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        title="Düzenle"
                                        onClick={() => handleEdit(request)}
                                        disabled={isLoading || actionLoading}
                                      >
                                        <Edit size={14} />
                                      </Button>
                                    )}
                                    {request.status !== 'REJECTED' && request.status !== 'CANCELLED' && (
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        title="İptal Et"
                                        onClick={() => handleCancel(request)}
                                        disabled={isLoading || actionLoading}
                                      >
                                        İptal Et
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          !isLoading && (
                            <tr>
                              <td colSpan={7} className="text-center py-4">
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

      <LeaveRequestModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        leaveRequest={selectedRequest}
        isEdit={isEdit}
      />

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>İzin Talebini Reddet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Red Nedeni</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="İzin talebini neden reddettiğinizi yazınız..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={actionLoading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowRejectModal(false)}
            disabled={actionLoading}
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? 'İşleniyor...' : 'Reddet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>İzin Talebini İptal Et</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bu izin talebini iptal etmek istediğinizden emin misiniz?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelModal(false)}
            disabled={actionLoading}
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'İşleniyor...' : 'İptal Et'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LeaveRequestsPage;