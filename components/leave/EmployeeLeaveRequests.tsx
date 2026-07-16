"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Form } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { leaveBalanceService } from '@/services/leave-balance.service';
import { Employee, LeaveRequest, LeaveBalance } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import LeaveRequestModal from '@/components/modals/LeaveRequestModal';
import LeaveDocumentModal from '@/components/leave/LeaveDocumentModal';
import { lookupService } from '@/services/lookup.service';
import DeleteModal from '@/components/DeleteModal';
import Pagination from '@/components/Pagination';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import { Edit, Plus, FileText, X, Info, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

interface EmployeeLeaveRequestsProps {
  employeeId?: string;
  hideCreateButton?: boolean;
}

const EmployeeLeaveRequests: React.FC<EmployeeLeaveRequestsProps> = ({ employeeId, hideCreateButton = false }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Sıralama State
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ASC' | 'DESC';
  }>({ key: 'created_at', direction: 'DESC' });

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLeaveTypeId, setFilterLeaveTypeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const fetchLeaveRequests = async (page: number = 1, sortKey: string = sortConfig.key, sortDir: 'ASC' | 'DESC' = sortConfig.direction) => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: itemsPerPage,
        sort: sortKey,
        direction: sortDir,
      };
      if (filterStatus) params.status = filterStatus;
      if (filterLeaveTypeId) params.leave_type_id = filterLeaveTypeId;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;

      let response;
      if (employeeId) {
        response = await leaveRequestService.getAll({ ...params, employee_id: employeeId });
      } else {
        response = await leaveRequestService.getMyLeaveRequests(params);
      }

      if (response.data) {
        setLeaveRequests(response.data);
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      } else {
        setLeaveRequests([]);
        setTotalPages(1);
        setTotalItems(0);
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
      if (employeeId) {
        const response = await leaveBalanceService.getBalancesByEmployeeId(employeeId);
        setLeaveBalances(response.data || []);
      } else {
        const response = await leaveBalanceService.getMyLeaveBalances();
        setLeaveBalances(response.data || []);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Bakiye bilgisi alınırken hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await lookupService.getLeaveTypesLookup();
      if (res?.data) setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Sıralama Fonksiyonları ---
  const handleSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
    fetchLeaveRequests(1, key, direction);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ASC' ? <ChevronUp size={14} className="ms-1" /> : <ChevronDown size={14} className="ms-1" />;
  };

  useEffect(() => {
    fetchLeaveRequests(1);
    fetchLeaveBalance();
    fetchLeaveTypes();
  }, [employeeId]);

  useEffect(() => {
    fetchLeaveRequests(1);
  }, [filterStatus, filterLeaveTypeId, filterStartDate, filterEndDate]);

  const handleCancelConfirm = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await leaveRequestService.cancelLeaveRequest(selectedRequest.id);
      toast.success('İzin talebi iptal edildi');
      fetchLeaveRequests(currentPage);
      setSelectedRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'İptal işlemi sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setActionLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge bg-warning">Onay Bekliyor</span>;
      case 'APPROVED': return <span className="badge bg-success">Onaylandı</span>;
      case 'REJECTED': return <span className="badge bg-danger">Reddedildi</span>;
      case 'CANCELLED': return <span className="badge bg-secondary">İptal Edildi</span>;
      default: return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return '-';
    }
  };

  const canCancelRequest = (request: LeaveRequest): boolean => {
    if (request.status !== 'APPROVED') return false;
    if (!request.start_date) return false;
    const startDate = new Date(request.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const handleEdit = (request: LeaveRequest) => { setSelectedRequest(request); setIsEdit(true); setShowModal(true); };
  const handleNew = () => { setSelectedRequest(null); setIsEdit(false); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedRequest(null); setIsEdit(false); };
  const handleShowDocuments = (request: LeaveRequest) => { setSelectedRequest(request); setShowDocumentModal(true); };
  const handleShowDetail = (request: LeaveRequest) => { setSelectedRequest(request); setShowDetailModal(true); };

  const handleDocumentModalClose = (updatedCount?: any) => {
    setShowDocumentModal(false);
    if (typeof updatedCount === 'number' && selectedRequest) {
      setLeaveRequests(prev =>
        prev.map((req: LeaveRequest) =>
          req.id === selectedRequest.id ? { ...req, document_count: updatedCount } : req
        )
      );
    }
  };

  const handleModalSave = () => { fetchLeaveRequests(currentPage); };

  const calculateProgressPercentage = (usedValue: number | undefined | null, totalValue: number | undefined | null): number => {
    const used = usedValue ? Number(usedValue) : 0;
    let total = totalValue ? Number(totalValue) : 0;
    if (total === 0) {
      total = 1;
    }
    if (used <= 0) return 0;
    return (used / total) * 100;
  };

  return (
    <>
      <div className="employee-leave-requests">
        <LoadingOverlay show={isLoading} message="İzin talepleri yükleniyor..." />

        {!employeeId && (
          <div className="page-heading-wrapper">
            <PageHeading
              heading="İzin Taleplerim"
              showCreateButton={!hideCreateButton}
              showFilterButton={false}
              createButtonText="Yeni İzin Talebi"
              onCreate={handleNew}
            />
          </div>
        )}

        {employeeId && !hideCreateButton && (
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '16px' }}>İzin Bakiye Bilgisi</h6>
            <Button variant="primary" onClick={handleNew} className="d-flex align-items-center gap-2">
              <Plus size={16} /> Yeni İzin Talebi
            </Button>
          </div>
        )}

        {employeeId && hideCreateButton && (
          <div className="mb-4">
            <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '16px' }}>İzin Bakiye Bilgisi</h6>
          </div>
        )}

        {/* Horizontal Leave Balances Table */}
        {balanceLoading ? (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center py-4 text-muted">Bakiyeler yükleniyor...</Card.Body>
          </Card>
        ) : leaveBalances.length > 0 ? (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ paddingLeft: '1.5rem', width: '25%' }}>İzin Türü</th>
                      <th className="text-center" style={{ width: '15%' }}>Toplam Gün</th>
                      <th className="text-center" style={{ width: '15%' }}>Kullanılan Gün</th>
                      <th className="text-center" style={{ width: '15%' }}>Kalan Gün</th>
                      <th style={{ paddingRight: '1.5rem', width: '30%' }}>Kullanım Oranı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalances.map((balance, index) => {
                      const total = balance.total_days || 0;
                      const used = balance.used_days || 0;
                      const remaining = balance.remaining_days || 0;
                      const progress = calculateProgressPercentage(used, total);
                      return (
                        <tr key={index}>
                          <td style={{ paddingLeft: '1.5rem', fontWeight: 600, color: '#334155' }}>
                            {balance.leave_type?.name || 'Yıllık İzin'}
                          </td>
                          <td className="text-center font-weight-bold text-dark">{total}</td>
                          <td className="text-center font-weight-bold text-warning">{used}</td>
                          <td className="text-center font-weight-bold text-success">{remaining}</td>
                          <td style={{ paddingRight: '1.5rem' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  height: '100%', 
                                  backgroundColor: progress > 100 ? '#dc2626' : '#10b981', 
                                  width: `${Math.min(progress, 100)}%`, 
                                  borderRadius: '4px' 
                                }}></div>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: progress > 100 ? '#dc2626' : '#64748b', minWidth: '40px', textAlign: 'right' }}>
                                %{Math.round(progress)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center py-4 text-muted">Kayıtlı izin bakiyesi bulunmuyor</Card.Body>
          </Card>
        )}

        <hr className="my-4" style={{ borderColor: '#e2e8f0' }} />

        {/* Leave Requests Header */}
        <div className="mb-3">
          <h6 style={{ fontWeight: 700, fontSize: '16px', color: '#495057' }}>
            {employeeId ? 'İzin Talepleri' : 'Taleplerim'}
          </h6>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="py-2 px-3">
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <FormSelectField
                  label="Durum"
                  name="filterStatus"
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="PENDING">Onay Bekliyor</option>
                  <option value="APPROVED">Onaylandı</option>
                  <option value="REJECTED">Reddedildi</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </FormSelectField>
              </Col>
              <Col md={3}>
                <FormSelectField
                  label="İzin Türü"
                  name="filterLeaveTypeId"
                  value={filterLeaveTypeId}
                  onChange={(e: any) => setFilterLeaveTypeId(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </FormSelectField>
              </Col>
              <Col md={3}>
                <FormDateField
                  label="Başlangıç Tarihi"
                  name="filterStartDate"
                  value={filterStartDate}
                  onChange={(e: any) => setFilterStartDate(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <FormDateField
                  label="Bitiş Tarihi"
                  name="filterEndDate"
                  value={filterEndDate}
                  onChange={(e: any) => setFilterEndDate(e.target.value)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Requests Table */}
        <Card className="border-0 shadow-sm position-relative mb-3">
          <Card.Body className="p-0">
            <div className="table-box">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th className="sortable-header" style={{ cursor: 'pointer', verticalAlign: 'middle' }} onClick={() => handleSort('leave_type_name')}>İzin Türü {getSortIcon('leave_type_name')}</th>
                      <th className="sortable-header" style={{ cursor: 'pointer', verticalAlign: 'middle' }} onClick={() => handleSort('start_date')}>Başlangıç Tarihi {getSortIcon('start_date')}</th>
                      <th className="sortable-header" style={{ cursor: 'pointer', verticalAlign: 'middle' }} onClick={() => handleSort('end_date')}>Bitiş Tarihi {getSortIcon('end_date')}</th>
                      <th className="sortable-header text-center" style={{ cursor: 'pointer', verticalAlign: 'middle' }} onClick={() => handleSort('requested_days')}>Kullanılan Gün {getSortIcon('requested_days')}</th>
                      <th className="sortable-header" style={{ cursor: 'pointer', verticalAlign: 'middle' }} onClick={() => handleSort('created_at')}>Talep Tarihi {getSortIcon('created_at')}</th>
                      <th className="text-center" style={{ verticalAlign: 'middle' }}>Durum</th>
                      <th className="text-end" style={{ verticalAlign: 'middle' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length ? (
                      leaveRequests.map((request: LeaveRequest) => (
                        <tr key={request.id}>
                          <td style={{ verticalAlign: 'middle' }}>{request.leave_type?.name || '-'}</td>
                          <td style={{ verticalAlign: 'middle' }}>{formatDate(request.start_date)}</td>
                          <td style={{ verticalAlign: 'middle' }}>{formatDate(request.end_date)}</td>
                          <td className="text-center" style={{ verticalAlign: 'middle' }}>{request.requested_days || '-'}</td>
                          <td style={{ verticalAlign: 'middle' }}>{formatDate(request.created_at)}</td>
                          <td className="text-center" style={{ verticalAlign: 'middle' }}>
                            <span style={{ display: 'inline-block', minWidth: '100px', textAlign: 'center' }}>
                              {getStatusBadge(request.status)}
                            </span>
                          </td>
                          <td className="text-end" style={{ verticalAlign: 'middle' }}>
                            <div className="d-flex justify-content-end gap-2">
                              {request.status === 'PENDING' && !employeeId && (
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
                              {request.leave_type?.is_required_document && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  title="Dökümanlar"
                                  onClick={() => handleShowDocuments(request)}
                                >
                                  <FileText size={16} />
                                  {(!request.document_count || request.document_count === 0) && (
                                    <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                                  )}
                                </Button>
                              )}
                              {!employeeId && (request.status === 'PENDING' || canCancelRequest(request)) && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  title="İptal Et"
                                  onClick={() => { setSelectedRequest(request); setShowCancelConfirm(true); }}
                                  disabled={isLoading || actionLoading}
                                >
                                  <X size={14} />
                                </Button>
                              )}
                              <Button
                                variant="outline-info"
                                size="sm"
                                title="Detaylar"
                                onClick={() => handleShowDetail(request)}
                              >
                                <Info size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      !isLoading && (
                        <tr>
                          <td colSpan={7} className="text-center py-4">İzin talebi bulunamadı</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Card.Body>
        </Card>

        {totalPages > 1 && (
          <div className="mt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => fetchLeaveRequests(page)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      <LeaveRequestModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        leaveRequest={selectedRequest}
        isEdit={isEdit}
      />

      {selectedRequest && showDetailModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">İzin Detayları</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-column gap-3">
                  <div><strong>İzin Türü: </strong> {selectedRequest.leave_type?.name || '-'}</div>
                  <div><strong>Durum: </strong> {getStatusBadge(selectedRequest.status)}</div>
                  <div><strong>Başlangıç Tarihi: </strong> {formatDate(selectedRequest.start_date)}</div>
                  <div><strong>Bitiş Tarihi: </strong> {formatDate(selectedRequest.end_date)}</div>
                  <div><strong>Kullanılan Gün: </strong> {selectedRequest.requested_days || '-'}</div>
                  <div><strong>Ücretli: </strong> {selectedRequest.is_paid ? 'Evet' : 'Hayır'}</div>
                  {selectedRequest.reason && (<div><strong>Açıklama: </strong> {selectedRequest.reason}</div>)}
                  <div><strong>Talep Tarihi: </strong> {formatDate(selectedRequest.created_at)}</div>
                  {selectedRequest.status === 'APPROVED' && (
                    <>
                      {selectedRequest.approved_at && (<div><strong>Onay Tarihi: </strong> {formatDate(selectedRequest.approved_at)}</div>)}
                      {selectedRequest.approver && (
                        <div>
                          <strong>Onaylayan: </strong>{' '}
                          {[selectedRequest.approver.employee?.first_name, selectedRequest.approver.employee?.last_name].filter(Boolean).join(' ') || selectedRequest.approver.email || '-'}
                        </div>
                      )}
                    </>
                  )}
                  {selectedRequest.status === 'REJECTED' && (
                    <>
                      {selectedRequest.rejected_at && (<div><strong>Red Tarihi: </strong> {formatDate(selectedRequest.rejected_at)}</div>)}
                      {selectedRequest.rejection_reason && (<div><strong>Red Nedeni: </strong> {selectedRequest.rejection_reason}</div>)}
                    </>
                  )}
                  {selectedRequest.status === 'CANCELLED' && (
                    <>
                      {selectedRequest.cancelled_at && (<div><strong>İptal Tarihi: </strong> {formatDate(selectedRequest.cancelled_at)}</div>)}
                      {selectedRequest.cancel_reason && (<div><strong>İptal Nedeni: </strong> {selectedRequest.cancel_reason}</div>)}
                    </>
                  )}
                  {selectedRequest.comments && (<div><strong>Yorumlar: </strong> {selectedRequest.comments}</div>)}
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <LeaveDocumentModal
          show={showDocumentModal}
          onHide={handleDocumentModalClose}
          leaveRequestId={selectedRequest.id}
          leaveTypeName={selectedRequest.leave_type?.name || 'İzin'}
          canEdit={true}
        />
      )}

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

export default EmployeeLeaveRequests;