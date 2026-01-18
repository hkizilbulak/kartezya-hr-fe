"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { leaveBalanceService } from '@/services/leave-balance.service';
import { LeaveRequest, Employee, LeaveBalance } from '@/models/hr/common.types';
import LeaveRequestModal from '@/components/modals/LeaveRequestModal';
import DeleteModal from '@/components/DeleteModal';
import Pagination from '@/components/Pagination';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Edit, Plus, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';

const MyLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Default sort: created_at DESC (en yeni talepleri göster)
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

      // Pagination ile kendi taleplerini getir
      const response = await leaveRequestService.getMyLeaveRequests({
        page,
        size: itemsPerPage,
        sort: sortKey,
        direction: sortDir
      });
      
      console.log('My Leave Requests Response:', response);
      
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

  const fetchLeaveBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await leaveBalanceService.getMyLeaveBalance();
      setLeaveBalance(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Bakiye bilgisi alınırken hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests(1, sortConfig.key, sortConfig.direction);
    fetchLeaveBalance();
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

  const handleCancelConfirm = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await leaveRequestService.cancelLeaveRequest(selectedRequest.id, {
        reason: 'İzin talebi iptal edildi'
      });
      toast.success('İzin talebi iptal edildi');
      fetchLeaveRequests(currentPage, sortConfig.key || undefined, sortConfig.direction);
      setSelectedRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'İptal işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
      setShowCancelConfirm(false)
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchLeaveRequests(newPage, sortConfig.key || undefined, sortConfig.direction);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning">Onay Bekliyor</span>;
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

  const handleNew = () => {
    setSelectedRequest(null);
    setIsEdit(false);
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
      <Row className="mb-4 px-3 pt-4">
        <Col lg={12} md={12} sm={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">İzin Taleplerim</h4>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleNew}
              disabled={isLoading}
            >
              <Plus size={16} className="me-2" style={{ display: 'inline' }} />
              Yeni
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="px-3 mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Row className="text-center">
                  <Col md={4} sm={6} xs={12} className="mb-3 mb-md-0">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted mb-2">Toplam İzin</h6>
                      <h4 className="text-primary fw-bold">
                        {balanceLoading ? '-' : (leaveBalance?.total_days || leaveBalance?.totalDays || 0)} Gün
                      </h4>
                    </div>
                  </Col>
                  <Col md={4} sm={6} xs={12} className="mb-3 mb-md-0">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted mb-2">Kullanılan İzin</h6>
                      <h4 className="text-warning fw-bold">
                        {balanceLoading ? '-' : (leaveBalance?.used_days || leaveBalance?.usedDays || 0)} Gün
                      </h4>
                    </div>
                  </Col>
                  <Col md={4} sm={6} xs={12}>
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted mb-2">Kalan İzin</h6>
                      <h4 className="text-success fw-bold">
                        {balanceLoading ? '-' : (leaveBalance?.remaining_days || leaveBalance?.remainingDays || 0)} Gün
                      </h4>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
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
                            const leaveTypeName = request.leave_type?.name || request.leaveType?.name;
                            const startDate = request.start_date || request.startDate;
                            const endDate = request.end_date || request.endDate;
                            const requestedDays = request.requested_days || request.requestedDays;

                            return (
                              <tr key={request.id}>
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
                                          variant="outline-primary"
                                          size="sm"
                                          title="Düzenle"
                                          onClick={() => handleEdit(request)}
                                          disabled={isLoading || actionLoading}
                                        >
                                          <Edit size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          title="İptal Et"
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setShowCancelConfirm(true);
                                          }}
                                          disabled={isLoading || actionLoading}
                                        >
                                          İptal Et
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
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

      <LeaveRequestModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        leaveRequest={selectedRequest}
        isEdit={isEdit}
      />

      {showCancelConfirm && (
        <DeleteModal
          onClose={() => setShowCancelConfirm(false)}
          onHandleDelete={handleCancelConfirm}
          loading={actionLoading}
          title="İptal Onayı"
          message="İzin talebini iptal etmek istediğinizden emin misiniz?"
          cancelLabel="Vazgeç"
          confirmLabel="İptal Et"
          loadingLabel="İptal Ediliyor"
          variant="danger"
        />
      )}
    </>
  );
};

export default MyLeaveRequests;
