"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { leaveBalanceService } from '@/services/leave-balance.service';
import { LeaveRequest, Employee, LeaveBalance } from '@/models/hr/common.types';
import { PageHeading } from '@/widgets';
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

  // Bekleyen talepler (PENDING)
  const pendingRequests = leaveRequests.filter(req => req.status === 'PENDING');
  
  // Tamamlanmış talepler (PENDING hariç)
  const completedRequests = leaveRequests.filter(req => req.status !== 'PENDING');

  /**
   * Güvenli progress bar yüzdesi hesapla
   * @param usedValue - Kullanılan gün sayısı
   * @param totalValue - Toplam gün sayısı
   * @returns Yüzde değeri (0-100)
   */
  const calculateProgressPercentage = (usedValue: number | undefined | null, totalValue: number | undefined | null): number => {
    const used = usedValue ? Number(usedValue) : 0;
    const total = totalValue ? Number(totalValue) : 0;
    
    if (!total || total === 0) return 0;
    if (used <= 0) return 0;
    
    const percentage = (used / total) * 100;
    return Math.min(percentage, 100); // Max 100%
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
        /* Sidebar wrapper */
        .sidebar-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .sidebar-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        /* Content wrapper */
        .content-wrapper {
          padding-left: 0;
          padding-right: 0;
        }
        @media (min-width: 769px) {
          .content-wrapper {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>

      <Container fluid className="page-container">
        <div className="page-heading-wrapper">
          <PageHeading 
            heading="İzin Taleplerim"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni İzin Talebi"
            onCreate={handleNew}
          />
        </div>

        <Row className="g-3">
          {/* Sol Sidebar */}
          <Col lg={3} md={12} sm={12} className="d-none d-lg-block sidebar-wrapper">
            <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h6 className="text-secondary mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>İZİN BAKİYE BİLGİSİ</h6>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Hakedilen İzin</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                      {balanceLoading ? '-' : (leaveBalance?.total_days || leaveBalance?.totalDays || 0)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      width: `${leaveBalance && (leaveBalance?.total_days || leaveBalance?.totalDays) ? 100 : 0}%`,
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Kullanılan İzin</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                      {balanceLoading ? '-' : (leaveBalance?.used_days || leaveBalance?.usedDays || 0)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#f59e0b',
                      width: `${calculateProgressPercentage(leaveBalance?.used_days || leaveBalance?.usedDays, leaveBalance?.total_days || leaveBalance?.totalDays)}%`,
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Kalan İzin</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                      {balanceLoading ? '-' : (leaveBalance?.remaining_days || leaveBalance?.remainingDays || 0)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#10b981',
                      width: `${calculateProgressPercentage(leaveBalance?.remaining_days || leaveBalance?.remainingDays, leaveBalance?.total_days || leaveBalance?.totalDays)}%`,
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Content */}
          <Col lg={9} md={12} sm={12} className="content-wrapper">
            {/* Mobil görünüm için özet kartlar */}
            <div className="d-lg-none mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Row>
                    <Col md={4} sm={6} xs={12} className="mb-4 mb-md-0">
                      <div className="d-flex flex-column">
                        <h6 className="text-muted mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Hakedilen İzin</h6>
                        <h4 className="text-primary fw-bold mb-2">
                          {balanceLoading ? '-' : (leaveBalance?.total_days || leaveBalance?.totalDays || 0)} Gün
                        </h4>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            width: `${leaveBalance && (leaveBalance?.total_days || leaveBalance?.totalDays) ? 100 : 0}%`,
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4} sm={6} xs={12} className="mb-4 mb-md-0">
                      <div className="d-flex flex-column">
                        <h6 className="text-muted mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Kullanılan İzin</h6>
                        <h4 className="text-warning fw-bold mb-2">
                          {balanceLoading ? '-' : (leaveBalance?.used_days || leaveBalance?.usedDays || 0)} Gün
                        </h4>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: '#f59e0b',
                            width: `${calculateProgressPercentage(leaveBalance?.used_days || leaveBalance?.usedDays, leaveBalance?.total_days || leaveBalance?.totalDays)}%`,
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4} sm={6} xs={12}>
                      <div className="d-flex flex-column">
                        <h6 className="text-muted mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Kalan İzin</h6>
                        <h4 className="text-success fw-bold mb-2">
                          {balanceLoading ? '-' : (leaveBalance?.remaining_days || leaveBalance?.remainingDays || 0)} Gün
                        </h4>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: '#10b981',
                            width: `${calculateProgressPercentage(leaveBalance?.remaining_days || leaveBalance?.remainingDays, leaveBalance?.total_days || leaveBalance?.totalDays)}%`,
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>

            {/* Bekleyen Talepler */}
            <div className="mb-4">
              <h6 className="mb-3" style={{ fontWeight: 700, fontSize: '16px' }}>Bekleyen Taleplerim</h6>
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
                          {pendingRequests.length ? (
                            pendingRequests.map((request: LeaveRequest) => {
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
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            !isLoading && (
                              <tr>
                                <td colSpan={6} className="text-center py-4">
                                  Bekleyen talep bulunamadı
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

            {/* Tamamlanmış Talepler */}
            <div>
              <h6 className="mb-3" style={{ fontWeight: 700, fontSize: '16px' }}>Tamamlanmış Taleplerim</h6>
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
                          </tr>
                        </thead>
                        <tbody>
                          {completedRequests.length ? (
                            completedRequests.map((request: LeaveRequest) => {
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
                                </tr>
                              );
                            })
                          ) : (
                            !isLoading && (
                              <tr>
                                <td colSpan={5} className="text-center py-4">
                                  Tamamlanmış talep bulunamadı
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
      </Container>

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
