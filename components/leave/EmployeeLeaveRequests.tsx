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
import { Edit, Plus, FileText, X, Info } from 'react-feather';
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

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLeaveTypeId, setFilterLeaveTypeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const fetchLeaveRequests = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: itemsPerPage,
        sort: 'created_at',
        direction: 'DESC',
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
    const total = totalValue ? Number(totalValue) : 0;
    if (!total || total === 0 || used <= 0) return 0;
    return Math.min((used / total) * 100, 100);
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
            <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '16px' }}>İzin Talepleri</h6>
            <Button variant="primary" onClick={handleNew} className="d-flex align-items-center gap-2">
              <Plus size={16} /> Yeni İzin Talebi
            </Button>
          </div>
        )}

        {employeeId && hideCreateButton && (
          <div className="mb-4">
            <h6 style={{ color: '#495057', fontWeight: 700, fontSize: '16px' }}>İzin Talepleri</h6>
          </div>
        )}

        <Row className="g-3">
          {/* İzin Bakiyeleri */}
          <Col lg={3} md={12} sm={12} className="sidebar-wrapper mb-4 mb-lg-0">
            <h6 className="text-secondary mb-3 d-lg-none" style={{ fontSize: '14px', fontWeight: 700 }}>İZİN BAKİYE BİLGİSİ</h6>
            {balanceLoading ? (
              <Card className="border-0 shadow-sm"><Card.Body className="text-center py-4 text-muted">Yükleniyor...</Card.Body></Card>
            ) : leaveBalances.length > 0 ? (
              leaveBalances.map((balance, index) => (
                <Card key={index} className="border-0 shadow-sm mb-3 position-relative" style={{ top: index === 0 ? '20px' : '0' }}>
                  <Card.Body>
                    <h6 className="text-secondary mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {(balance.leave_type?.name || 'YILLIK İZİN')} BAKİYESİ
                    </h6>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Hakedilen İzin</span>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{balance.total_days || 0}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${balance.total_days ? 100 : 0}%`, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Kullanılan İzin</span>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{balance.used_days || 0}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#f59e0b', width: `${calculateProgressPercentage(balance.used_days, balance.total_days)}%`, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Kalan İzin</span>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{balance.remaining_days || 0}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#10b981', width: `${calculateProgressPercentage(balance.remaining_days, balance.total_days)}%`, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm" style={{ top: '20px' }}>
                <Card.Body className="text-center py-4">
                  <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Kayıtlı izin bakiyesi bulunmuyor</p>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Talepler */}
          <Col lg={9} md={12} sm={12} className="content-wrapper">
            <h6 className="mb-3" style={{ fontWeight: 700, fontSize: '16px' }}>
              {employeeId ? 'İzin Talepleri' : 'Taleplerim'}
            </h6>

            {/* Filtreler */}
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

            {/* Tablo */}
            <Card className="border-0 shadow-sm position-relative">
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
                          <th className="text-end">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests.length ? (
                          leaveRequests.map((request: LeaveRequest) => (
                            <tr key={request.id}>
                              <td>{request.leave_type?.name || '-'}</td>
                              <td>{formatDate(request.start_date)}</td>
                              <td>{formatDate(request.end_date)}</td>
                              <td>{request.requested_days || '-'}</td>
                              <td>{getStatusBadge(request.status)}</td>
                              <td className="text-end">
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
                              <td colSpan={6} className="text-center py-4">İzin talebi bulunamadı</td>
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
          </Col>
        </Row>
      </div>

      <LeaveRequestModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleModalSave}
        leaveRequest={selectedRequest}
        isEdit={isEdit}
      />

      {/* Detail Modal */}
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
                  <div>
                    <strong>İzin Türü: </strong> {selectedRequest.leave_type?.name || '-'}
                  </div>
                  <div>
                    <strong>Durum: </strong> {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <strong>Başlangıç Tarihi: </strong> {formatDate(selectedRequest.start_date)}
                  </div>
                  <div>
                    <strong>Bitiş Tarihi: </strong> {formatDate(selectedRequest.end_date)}
                  </div>
                  <div>
                    <strong>Kullanılan Gün: </strong> {selectedRequest.requested_days || '-'}
                  </div>
                  <div>
                    <strong>Ücretli: </strong> {selectedRequest.is_paid ? 'Evet' : 'Hayır'}
                  </div>
                  {selectedRequest.reason && (
                    <div>
                      <strong>Açıklama: </strong> {selectedRequest.reason}
                    </div>
                  )}
                  <div>
                    <strong>Talep Tarihi: </strong> {formatDate(selectedRequest.created_at)}
                  </div>
                  {selectedRequest.status === 'APPROVED' && (
                    <>
                      {selectedRequest.approved_at && (
                        <div>
                          <strong>Onay Tarihi: </strong> {formatDate(selectedRequest.approved_at)}
                        </div>
                      )}
                      {selectedRequest.approver && (
                        <div>
                          <strong>Onaylayan: </strong>{' '}
                          {[
                            selectedRequest.approver.employee?.first_name,
                            selectedRequest.approver.employee?.last_name,
                          ].filter(Boolean).join(' ') || selectedRequest.approver.email || '-'}
                        </div>
                      )}
                    </>
                  )}
                  {selectedRequest.status === 'REJECTED' && (
                    <>
                      {selectedRequest.rejected_at && (
                        <div>
                          <strong>Red Tarihi: </strong> {formatDate(selectedRequest.rejected_at)}
                        </div>
                      )}
                      {selectedRequest.rejection_reason && (
                        <div>
                          <strong>Red Nedeni: </strong> {selectedRequest.rejection_reason}
                        </div>
                      )}
                    </>
                  )}
                  {selectedRequest.status === 'CANCELLED' && (
                    <>
                      {selectedRequest.cancelled_at && (
                        <div>
                          <strong>İptal Tarihi: </strong> {formatDate(selectedRequest.cancelled_at)}
                        </div>
                      )}
                      {selectedRequest.cancel_reason && (
                        <div>
                          <strong>İptal Nedeni: </strong> {selectedRequest.cancel_reason}
                        </div>
                      )}
                    </>
                  )}
                  {selectedRequest.comments && (
                    <div>
                      <strong>Yorumlar: </strong> {selectedRequest.comments}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        </div>
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

      {selectedRequest && showDocumentModal && (
        <LeaveDocumentModal
          show={showDocumentModal}
          onHide={handleDocumentModalClose}
          leaveRequestId={selectedRequest.id}
          leaveTypeName={selectedRequest.leave_type?.name || 'İzin'}
          canEdit={true}
        />
      )}
    </>
  );
};

export default EmployeeLeaveRequests;
