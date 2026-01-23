"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Container } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { LeaveRequest, Employee } from '@/models/hr/common.types';
import { PageHeading } from '@/widgets';
import LeaveRequestModal from '@/components/modals/LeaveRequestModal';
import Pagination from '@/components/Pagination';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Check, X, Edit, ChevronUp, ChevronDown } from 'react-feather';
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
  const [showApproveWarningModal, setShowApproveWarningModal] = useState(false);
  const [approveWarningRequest, setApproveWarningRequest] = useState<LeaveRequest | null>(null);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ASC' | 'DESC';
  }>({
    key: 'created_at',
    direction: 'DESC'
  });

  const fetchLeaveRequests = async (page: number = 1, sortKey: string = 'created_at', sortDir: 'ASC' | 'DESC' = 'DESC') => {
    try {
      setIsLoading(true);

      const response = await leaveRequestService.getAll({ 
        page, 
        limit: itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
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
    fetchLeaveRequests(1, sortConfig.key, sortConfig.direction);
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
    const leaveTypeName = request.leave_type?.name || request.leaveType?.name;
    const requestedDays = request.requested_days || request.requestedDays;
    const remainingDays = request.remaining_days;

    if (leaveTypeName === 'Yıllık İzin' || leaveTypeName === 'Annual Leave') {
      if (
        remainingDays !== undefined && 
        remainingDays !== null && 
        requestedDays !== undefined && 
        requestedDays !== null &&
        remainingDays < requestedDays
      ) {
        setApproveWarningRequest(request);
        setShowApproveWarningModal(true);
        return;
      }
    }

    await performApprove(request);
  };

  const performApprove = async (request: LeaveRequest) => {
    setActionLoading(true);
    try {
      await leaveRequestService.approveLeaveRequest(request.id, {});
      toast.success('İzin talebi onaylandı');
      fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
      setShowApproveWarningModal(false);
      setApproveWarningRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Onaylama sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWithWarning = async () => {
    if (approveWarningRequest) {
      await performApprove(approveWarningRequest);
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

  const getEmployeeName = (employee: Employee | undefined): string => {
    if (!employee) return '-';
    const firstName = employee.first_name || '';
    const lastName = employee.last_name || '';
    return `${firstName} ${lastName}`.trim();
  };

  const handleEdit = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsEdit(true);
    setShowModal(true);
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
        @media (max-width: 768px) {
          table td, table th {
            padding: 10px 8px;
          }
        }
        table thead tr {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        /* Container responsive padding */
        .page-container {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }
        @media (max-width: 768px) {
          .page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        }
        /* Inner divs responsive padding */
        .table-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .table-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        /* Page heading wrapper responsive padding */
        .page-heading-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .page-heading-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>

      <Container fluid className="page-container">
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="İzin Talepleri"
            showCreateButton={false}
            showFilterButton={false}
          />
        </div>

        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">
                <LoadingOverlay show={isLoading} message="İzin talepleri yükleniyor..." />

                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Talep Tarihi</th>
                            <th>Çalışan ID</th>
                            <th>Çalışan Adı</th>
                            <th>İzin Türü</th>
                            <th>Başlangıç Tarihi</th>
                            <th>Bitiş Tarihi</th>
                            <th>Kullanılan Gün</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveRequests.length ? (
                            leaveRequests.map((request: LeaveRequest) => {
                              const leaveTypeName = request.leave_type?.name || request.leaveType?.name;
                              const startDate = request.start_date || request.startDate;
                              const endDate = request.end_date || request.endDate;
                              const requestedDays = request.requested_days || request.requestedDays;
                              const createdAt = request.created_at || request.createdAt;
                              const employeeId = request.employee?.id || '-';

                              return (
                                <tr key={request.id}>
                                  <td>{formatDate(createdAt)}</td>
                                  <td>{employeeId}</td>
                                  <td>{getEmployeeName(request.employee)}</td>
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
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            title="Düzenle"
                                            onClick={() => handleEdit(request)}
                                            disabled={isLoading || actionLoading}
                                          >
                                            <Edit size={14} />
                                          </Button>
                                        </>
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
                                <td colSpan={9} className="text-center py-4">
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

        <Modal show={showApproveWarningModal} onHide={() => setShowApproveWarningModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Yetersiz Bakiye Uyarısı</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Bu izin talebi için yeterli bakiye bulunmamaktadır. Yine de onaylamak istiyor musunuz?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowApproveWarningModal(false)}
              disabled={actionLoading}
            >
              İptal
            </Button>
            <Button 
              variant="success" 
              onClick={handleApproveWithWarning}
              disabled={actionLoading}
            >
              {actionLoading ? 'İşleniyor...' : 'Onayla'}
            </Button>
          </Modal.Footer>
        </Modal>

        <LeaveRequestModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleModalSave}
          leaveRequest={selectedRequest}
          isEdit={isEdit}
        />
      </Container>
    </>
  );
};

export default LeaveRequestsPage;