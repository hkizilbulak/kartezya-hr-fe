"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Container, Badge } from 'react-bootstrap';
import { leaveRequestService } from '@/services/leave-request.service';
import { Employee, LeaveRequest } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import LeaveRequestModal from '@/components/modals/LeaveRequestModal';
import LeaveDocumentModal from '@/components/leave/LeaveDocumentModal';
import Pagination from '@/components/Pagination';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import { Check, X, Edit, ChevronUp, ChevronDown, FileText, Info } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';
import { leaveTypeService } from '@/services/leave-type.service';

const LeaveRequestsPage = () => {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<LeaveRequest[]>([]);
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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentRequest, setSelectedDocumentRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<LeaveRequest | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [completedTotalPages, setCompletedTotalPages] = useState(1);
  const [pendingTotalItems, setPendingTotalItems] = useState(0);
  const [completedTotalItems, setCompletedTotalItems] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLeaveTypeId, setFilterLeaveTypeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const [pendingSortConfig, setPendingSortConfig] = useState<{
    key: string;
    direction: 'ASC' | 'DESC';
  }>({
    key: 'created_at',
    direction: 'DESC'
  });
  const [completedSortConfig, setCompletedSortConfig] = useState<{
    key: string;
    direction: 'ASC' | 'DESC';
  }>({
    key: 'created_at',
    direction: 'DESC'
  });

  const buildSharedParams = (page: number, sortKey: string, sortDir: 'ASC' | 'DESC', perPage: number, listGroup: 'pending' | 'completed') => {
    const params: any = {
      page,
      limit: perPage,
      sort: sortKey,
      direction: sortDir,
      list_group: listGroup,
    };
    if (filterStatus) params.status = filterStatus;
    if (filterLeaveTypeId) params.leave_type_id = filterLeaveTypeId;
    if (filterStartDate) params.start_date = filterStartDate;
    if (filterEndDate) params.end_date = filterEndDate;
    return params;
  };

  const fetchPendingRequests = async (
    page: number = pendingPage,
    sortKey: string = pendingSortConfig.key,
    sortDir: 'ASC' | 'DESC' = pendingSortConfig.direction,
    perPage: number = itemsPerPage
  ) => {
    const response = await leaveRequestService.getAll(buildSharedParams(page, sortKey, sortDir, perPage, 'pending'));
    setPendingRequests(response.data || []);
    setPendingTotalPages(response.page?.total_pages || 1);
    setPendingTotalItems(response.page?.total || 0);
    setPendingPage(page);
  };

  const fetchCompletedRequests = async (
    page: number = completedPage,
    sortKey: string = completedSortConfig.key,
    sortDir: 'ASC' | 'DESC' = completedSortConfig.direction,
    perPage: number = itemsPerPage
  ) => {
    const response = await leaveRequestService.getAll(buildSharedParams(page, sortKey, sortDir, perPage, 'completed'));
    setCompletedRequests(response.data || []);
    setCompletedTotalPages(response.page?.total_pages || 1);
    setCompletedTotalItems(response.page?.total || 0);
    setCompletedPage(page);
  };

  const refreshLeaveLists = async (
    pendingPg: number = pendingPage,
    completedPg: number = completedPage,
    perPage: number = itemsPerPage,
    pendingSort: { key: string; direction: 'ASC' | 'DESC' } = pendingSortConfig,
    completedSort: { key: string; direction: 'ASC' | 'DESC' } = completedSortConfig
  ) => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchPendingRequests(pendingPg, pendingSort.key, pendingSort.direction, perPage),
        fetchCompletedRequests(completedPg, completedSort.key, completedSort.direction, perPage),
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypeService.getAll();
      if (response.data) {
        setLeaveTypes(response.data);
      }
    } catch (error) {
      console.error('İzin tipleri yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    refreshLeaveLists(1, 1, itemsPerPage, pendingSortConfig, completedSortConfig);
    fetchLeaveTypes();
  }, [filterStatus, filterLeaveTypeId, filterStartDate, filterEndDate]);

  // İptal butonunun gösterilip gösterilmeyeceğini kontrol et
  const canCancelRequest = (request: LeaveRequest): boolean => {
    if (request.status !== 'APPROVED') return false;
    const startDateStr = request.start_date || request.start_date;
    if (!startDateStr) return false;
    const startDate = new Date(startDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const handlePendingSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (pendingSortConfig.key === key && pendingSortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    const next = { key, direction };
    setPendingSortConfig(next);
    setPendingPage(1);
    setIsLoading(true);
    fetchPendingRequests(1, key, direction, itemsPerPage)
      .catch((error: any) => {
        toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu'));
      })
      .finally(() => setIsLoading(false));
  };

  const handleCompletedSort = (key: string) => {
    let direction: 'ASC' | 'DESC' = 'ASC';
    if (completedSortConfig.key === key && completedSortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    const next = { key, direction };
    setCompletedSortConfig(next);
    setCompletedPage(1);
    setIsLoading(true);
    fetchCompletedRequests(1, key, direction, itemsPerPage)
      .catch((error: any) => {
        toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu'));
      })
      .finally(() => setIsLoading(false));
  };

  const getPendingSortIcon = (columnKey: string) => {
    if (pendingSortConfig.key !== columnKey) {
      return null;
    }
    return pendingSortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const getCompletedSortIcon = (columnKey: string) => {
    if (completedSortConfig.key !== columnKey) {
      return null;
    }
    return completedSortConfig.direction === 'ASC' ?
      <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> :
      <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
  };

  const handleShowDocuments = (request: LeaveRequest) => {
    setSelectedDocumentRequest(request);
    setShowDocumentModal(true);
  };

  const handleShowDetail = (request: LeaveRequest) => {
    setSelectedDetailRequest(request);
    setShowDetailModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocumentRequest(null);
    // Refresh data to update document count
    refreshLeaveLists();
  };

  const handleApprove = async (request: LeaveRequest) => {
    const leaveTypeName = request.leave_type?.name || request.leave_type?.name;
    const requestedDays = request.requested_days || request.requested_days;
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
      refreshLeaveLists();
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
      refreshLeaveLists();
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
      await leaveRequestService.cancelLeaveRequest(cancelRequest.id);
      toast.success('İzin talebi iptal edildi');
      refreshLeaveLists();
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

  const handlePendingPageChange = (newPage: number) => {
    fetchPendingRequests(newPage, pendingSortConfig.key, pendingSortConfig.direction, itemsPerPage).catch((error: any) => {
      toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu'));
    });
  };

  const handleCompletedPageChange = (newPage: number) => {
    fetchCompletedRequests(newPage, completedSortConfig.key, completedSortConfig.direction, itemsPerPage).catch((error: any) => {
      toast.error(translateErrorMessage(error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu'));
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setPendingPage(1);
    setCompletedPage(1);
    refreshLeaveLists(1, 1, newPageSize, pendingSortConfig, completedSortConfig);
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

  const getHalfDayInfo = (request: LeaveRequest): string => {
    const isStartFullDay = request.is_finish_date_full_day !== false;
    const isEndFullDay = request.is_finish_date_full_day !== false;
    
    if (isStartFullDay && isEndFullDay) {
      return 'Tam Gün';
    } else if (!isStartFullDay && !isEndFullDay) {
      return 'Yarım Gün (İki Taraf)';
    } else if (!isStartFullDay) {
      return 'Yarım Gün (Başlangıç)';
    } else {
      return 'Yarım Gün (Bitiş)';
    }
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
    refreshLeaveLists();
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="İzin talepleri yükleniyor..." />

        <div className="page-heading-wrapper">
          <PageHeading 
            heading="İzin Talepleri"
            showCreateButton={false}
            showFilterButton={false}
          />
        </div>

        <Row>
          <Col lg={12} md={12} sm={12}>
            {/* Bekleyen Talepler */}
            <div className="mb-4">
              <h6 className="mb-3" style={{ fontWeight: 700, fontSize: '16px' }}>Bekleyen Talepler</h6>
              <div className="table-wrapper">
                <Card className="border-0 shadow-sm position-relative">
                  <Card.Body className="p-0">
                    <div className="table-box">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead>
                            <tr>
                              <th onClick={() => handlePendingSort('created_at')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Talep Tarihi {getPendingSortIcon('created_at')}
                              </th>
                              <th onClick={() => handlePendingSort('employee_name')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Personel Adı {getPendingSortIcon('employee_name')}
                              </th>
                              <th onClick={() => handlePendingSort('leave_type_name')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                İzin Türü {getPendingSortIcon('leave_type_name')}
                              </th>
                              <th onClick={() => handlePendingSort('start_date')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Başlangıç Tarihi {getPendingSortIcon('start_date')}
                              </th>
                              <th onClick={() => handlePendingSort('end_date')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Bitiş Tarihi {getPendingSortIcon('end_date')}
                              </th>
                              <th onClick={() => handlePendingSort('requested_days')} className="sortable-header text-center" style={{ cursor: 'pointer' }}>
                                Kullanılan Gün {getPendingSortIcon('requested_days')}
                              </th>
                              <th>Durum</th>
                              <th>İşlemler</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingRequests.length ? (
                              pendingRequests.map((request: LeaveRequest) => {
                                const leaveTypeName = request.leave_type?.name || request.leave_type?.name;
                                const startDate = request.start_date || request.start_date;
                                const endDate = request.end_date || request.end_date;
                                const requestedDays = request.requested_days || request.requested_days;
                                const createdAt = request.created_at || request.createdAt;
                                const employeeId = request.employee?.id || '-';

                                return (
                                  <tr key={request.id}>
                                    <td>{formatDate(createdAt)}</td>
                                    <td>{request.employee ? getEmployeeName(request.employee) : ''}</td>
                                    <td>{leaveTypeName}</td>
                                    <td>{formatDate(startDate)}</td>
                                    <td>{formatDate(endDate)}</td>
                                    <td className="text-center">{requestedDays || '-'}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>
                                      <div className="d-flex justify-content-end w-100">
                                        <div className="d-flex gap-2">
                                          {request.leave_type?.is_required_document && (
                                            <Button
                                              variant="outline-secondary"
                                              size="sm"
                                              onClick={() => handleShowDocuments(request)}
                                              title="Dökümanlar"
                                            >
                                              <FileText size={16} />
                                              {(!request.document_count || request.document_count === 0) && (
                                                <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                                              )}
                                            </Button>
                                          )}
                                          {request.status === 'PENDING' ? (
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
                                          ) : canCancelRequest(request) ? (
                                            <Button
                                              variant="outline-warning"
                                              size="sm"
                                              title="İptal Et"
                                              onClick={() => handleCancelClick(request)}
                                              disabled={isLoading || actionLoading}
                                            >
                                              <X size={14} />
                                            </Button>
                                          ) : null}
                                          <Button
                                            variant="outline-info"
                                            size="sm"
                                            title="Detaylar"
                                            onClick={() => handleShowDetail(request)}
                                          >
                                            <Info size={14} />
                                          </Button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={8} className="text-center py-4">
                                  Bekleyen talep bulunamadı
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Bekleyen Talepler Pagination */}
              {pendingTotalItems > 0 && (
                <div className="px-3 mt-3">
                  <Pagination
                    currentPage={pendingPage}
                    totalPages={pendingTotalPages}
                    totalItems={pendingTotalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePendingPageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </div>

            {/* Tamamlanmış Talepler */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0" style={{ fontWeight: 700, fontSize: '16px' }}>Tamamlanmış Talepler</h6>
              </div>
              
              <Card className="border-0 shadow-sm mb-3">
                <Card.Body className="py-2 px-3">
                  <Row className="g-2 align-items-end">
                    <Col md={3}>
                      <Form.Group>
                        <FormSelectField
                          label="Durum"
                          name="filterStatus"
                          value={filterStatus}
                          onChange={(e: any) => setFilterStatus(e.target.value)}
                        >
                          <option value="">Tümü (Tamamlananlar)</option>
                          <option value="APPROVED">Onaylandı</option>
                          <option value="REJECTED">Reddedildi</option>
                          <option value="CANCELLED">İptal Edildi</option>
                        </FormSelectField>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <FormSelectField
                          label="İzin Türü"
                          name="filterLeaveTypeId"
                          value={filterLeaveTypeId}
                          onChange={(e: any) => setFilterLeaveTypeId(e.target.value)}
                        >
                          <option value="">Tümü</option>
                          {leaveTypes.map(type => (
                            <option key={type.id} value={type.id.toString()}>{type.name}</option>
                          ))}
                        </FormSelectField>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <FormDateField
                          label="Başlangıç Tarihi"
                          name="filterStartDate"
                          value={filterStartDate}
                          onChange={(e: any) => setFilterStartDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <FormDateField
                          label="Bitiş Tarihi"
                          name="filterEndDate"
                          value={filterEndDate}
                          onChange={(e: any) => setFilterEndDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="table-wrapper">
                <Card className="border-0 shadow-sm position-relative">
                  <Card.Body className="p-0">
                    <div className="table-box">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead>
                            <tr>
                              <th onClick={() => handleCompletedSort('created_at')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Talep Tarihi {getCompletedSortIcon('created_at')}
                              </th>
                              <th onClick={() => handleCompletedSort('employee_name')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Personel Adı {getCompletedSortIcon('employee_name')}
                              </th>
                              <th onClick={() => handleCompletedSort('leave_type_name')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                İzin Türü {getCompletedSortIcon('leave_type_name')}
                              </th>
                              <th onClick={() => handleCompletedSort('start_date')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Başlangıç Tarihi {getCompletedSortIcon('start_date')}
                              </th>
                              <th onClick={() => handleCompletedSort('end_date')} className="sortable-header" style={{ cursor: 'pointer' }}>
                                Bitiş Tarihi {getCompletedSortIcon('end_date')}
                              </th>
                              <th onClick={() => handleCompletedSort('requested_days')} className="sortable-header text-center" style={{ cursor: 'pointer' }}>
                                Kullanılan Gün {getCompletedSortIcon('requested_days')}
                              </th>
                              <th>Durum</th>
                              <th>İşlemler</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completedRequests.length ? (
                              completedRequests.map((request: LeaveRequest) => {
                                const leaveTypeName = request.leave_type?.name || request.leave_type?.name;
                                const startDate = request.start_date || request.start_date;
                                const endDate = request.end_date || request.end_date;
                                const requestedDays = request.requested_days || request.requested_days;
                                const createdAt = request.created_at || request.createdAt;
                                const employeeId = request.employee?.id || '-';

                                return (
                                  <tr key={request.id}>
                                    <td>{formatDate(createdAt)}</td>
                                    <td>{request.employee ? getEmployeeName(request.employee) : ''}</td>
                                    <td>{leaveTypeName}</td>
                                    <td>{formatDate(startDate)}</td>
                                    <td>{formatDate(endDate)}</td>
                                    <td className="text-center">{requestedDays || '-'}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td className="text-end">
                                      <div className="d-flex justify-content-end gap-2">
                                        {request.leave_type?.is_required_document && (
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleShowDocuments(request);
                                            }}
                                            title="Dökümanlar"
                                          >
                                            <FileText size={16} />
                                            {(!request.document_count || request.document_count === 0) && (
                                              <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                                            )}
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
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={8} className="text-center py-4">
                                  Tamamlanmış talep bulunamadı
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Tamamlanmış Talepler Pagination */}
              {completedTotalItems > 0 && (
                <div className="px-3 mt-3">
                  <Pagination
                    currentPage={completedPage}
                    totalPages={completedTotalPages}
                    totalItems={completedTotalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handleCompletedPageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

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
            {approveWarningRequest && (
              <p>
                Çalışan: {getEmployeeName(approveWarningRequest.employee)}<br />
                İstenen Gün: {approveWarningRequest.requested_days || '-'}<br />
                Mevcut Bakiye: {approveWarningRequest.remaining_days || '-'}
              </p>
            )}
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

        {/* İzin Detay Modal */}
        {selectedDetailRequest && showDetailModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">İzin Detayları</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="d-flex flex-column gap-3">
                    <div><strong>Personel: </strong>{getEmployeeName(selectedDetailRequest.employee)}</div>
                    <div><strong>İzin Türü: </strong>{selectedDetailRequest.leave_type?.name || '-'}</div>
                    <div><strong>Durum: </strong>{getStatusBadge(selectedDetailRequest.status)}</div>
                    <div><strong>Talep Tarihi: </strong>{formatDate(selectedDetailRequest.created_at)}</div>
                    <div><strong>Başlangıç Tarihi: </strong>{formatDate(selectedDetailRequest.start_date)}</div>
                    <div><strong>Bitiş Tarihi: </strong>{formatDate(selectedDetailRequest.end_date)}</div>
                    <div><strong>Kullanılan Gün: </strong>{selectedDetailRequest.requested_days || '-'}</div>
                    <div><strong>Ücretli: </strong>{selectedDetailRequest.is_paid ? 'Evet' : 'Hayır'}</div>
                    {selectedDetailRequest.reason && (
                      <div><strong>Açıklama: </strong>{selectedDetailRequest.reason}</div>
                    )}
                    {selectedDetailRequest.status === 'APPROVED' && (
                      <>
                        {selectedDetailRequest.approved_at && (
                          <div><strong>Onay Tarihi: </strong>{formatDate(selectedDetailRequest.approved_at)}</div>
                        )}
                        {selectedDetailRequest.approver && (
                          <div>
                            <strong>Onaylayan: </strong>
                            {[
                              selectedDetailRequest.approver.employee?.first_name,
                              selectedDetailRequest.approver.employee?.last_name,
                            ].filter(Boolean).join(' ') || selectedDetailRequest.approver.email || '-'}
                          </div>
                        )}
                      </>
                    )}
                    {selectedDetailRequest.status === 'REJECTED' && (
                      <>
                        {selectedDetailRequest.rejected_at && (
                          <div><strong>Red Tarihi: </strong>{formatDate(selectedDetailRequest.rejected_at)}</div>
                        )}
                        {selectedDetailRequest.rejection_reason && (
                          <div><strong>Red Nedeni: </strong>{selectedDetailRequest.rejection_reason}</div>
                        )}
                      </>
                    )}
                    {selectedDetailRequest.status === 'CANCELLED' && (
                      <>
                        {selectedDetailRequest.cancelled_at && (
                          <div><strong>İptal Tarihi: </strong>{formatDate(selectedDetailRequest.cancelled_at)}</div>
                        )}
                        {selectedDetailRequest.cancel_reason && (
                          <div><strong>İptal Nedeni: </strong>{selectedDetailRequest.cancel_reason}</div>
                        )}
                      </>
                    )}
                    {selectedDetailRequest.comments && (
                      <div><strong>Yorumlar: </strong>{selectedDetailRequest.comments}</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <LeaveDocumentModal
          show={showDocumentModal}
          onHide={handleCloseDocumentModal}
          leaveRequestId={selectedDocumentRequest?.id || 0}
          leaveTypeName={selectedDocumentRequest?.leave_type?.name || ''}
          canEdit={true} // Admin can always upload/delete documents
        />
    </>
  );
};

export default LeaveRequestsPage;