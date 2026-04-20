"use client";
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Modal } from 'react-bootstrap';
import expenseService from '@/services/expense.service';
import { ExpenseRequest } from '@/models/hr/expense-models';
import { PageHeading } from '@/widgets';
import ExpenseDocumentModal from '@/components/expense/ExpenseDocumentModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import Pagination from '@/components/Pagination';
import { Check, X, DollarSign, FileText, Info } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

const AdminExpenseRequests: React.FC = () => {
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Add new filters
  const [filterExpenseTypeId, setFilterExpenseTypeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const fetchExpenseTypes = async () => {
    try {
      const response = await expenseService.getExpenseTypes();
      if (response.data) {
        setExpenseTypes(response.data);
      }
    } catch (error) {
      console.error('Masraf tipleri yüklenirken hata:', error);
    }
  };

  const fetchExpenseRequests = async (page: number = 1, status?: string) => {
    try {
      setIsLoading(true);
      
      const response = await expenseService.getAllExpenseRequests(
        page, 
        itemsPerPage, 
        undefined,
        status || undefined,
        undefined,
        'desc',
        filterExpenseTypeId,
        filterStartDate,
        filterEndDate
      );
      
      if (response.data) {
        setExpenseRequests(response.data);
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      } else {
        setExpenseRequests([]);
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

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  useEffect(() => {
    fetchExpenseRequests(1, statusFilter);
  }, [statusFilter, filterExpenseTypeId, filterStartDate, filterEndDate]);

  const handleApproveClick = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;

    try {
      await expenseService.approveExpenseRequest(selectedRequest.id, selectedRequest.amount);
      toast.success('Masraf talebi onaylandı');
      fetchExpenseRequests(currentPage, statusFilter);
      setShowApproveModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Onaylama işlemi başarısız';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleRejectClick = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Red nedeni giriniz');
      return;
    }

    try {
      await expenseService.rejectExpenseRequest(selectedRequest.id, rejectionReason);
      toast.success('Masraf talebi reddedildi');
      fetchExpenseRequests(currentPage, statusFilter);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Reddetme işlemi başarısız';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleMarkPaidClick = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setPaymentReference('');
    setShowPaidModal(true);
  };

  const handleMarkPaidConfirm = async () => {
    if (!selectedRequest || !paymentReference.trim()) {
      toast.error('Ödeme referans numarası giriniz');
      return;
    }

    try {
      await expenseService.markExpenseAsPaid(selectedRequest.id, paymentReference);
      toast.success('Masraf ödendi olarak işaretlendi');
      fetchExpenseRequests(currentPage, statusFilter);
      setShowPaidModal(false);
      setSelectedRequest(null);
      setPaymentReference('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'İşlem başarısız';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleShowDocuments = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setShowDocumentModal(true);
  };

  const handleShowDetail = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; text: string }> = {
      'PENDING': { variant: 'warning', text: 'Beklemede' },
      'APPROVED': { variant: 'success', text: 'Onaylandı' },
      'REJECTED': { variant: 'danger', text: 'Reddedildi' },
      'PAID': { variant: 'info', text: 'Ödendi' },
      'CANCELLED': { variant: 'secondary', text: 'İptal Edildi' },
    };
    const config = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbol: Record<string, string> = {
      'TRY': '₺',
      'USD': '$',
      'EUR': '€',
    };
    const formattedAmount = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${formattedAmount} ${currencySymbol[currency] || currency}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <>
      <LoadingOverlay show={isLoading} />
      
      <PageHeading 
        heading="Masraf Yönetimi"
        showCreateButton={false}
        showFilterButton={false}
      />

      <div className="content-wrapper">
        <div className="content-header">
          {/* Admin sayfası, create butonu PageHeading'de yok */}
        </div>
        
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="py-2 px-3">
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <FormSelectField
                    label="Durum Filtrele"
                    name="statusFilter"
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    <option value="PENDING">Beklemede</option>
                    <option value="APPROVED">Onaylandı</option>
                    <option value="REJECTED">Reddedildi</option>
                    <option value="PAID">Ödendi</option>
                  </FormSelectField>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <FormSelectField
                    label="Masraf Türü"
                    name="filterExpenseTypeId"
                    value={filterExpenseTypeId}
                    onChange={(e: any) => setFilterExpenseTypeId(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {expenseTypes.map(type => (
                      <option key={type.id} value={type.id.toString()}>{type.name}</option>
                    ))}
                  </FormSelectField>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <FormDateField
                    label="Masraf Başlangıç Tarihi"
                    name="filterStartDate"
                    value={filterStartDate}
                    onChange={(e: any) => setFilterStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <FormDateField
                    label="Masraf Bitiş Tarihi"
                    name="filterEndDate"
                    value={filterEndDate}
                    onChange={(e: any) => setFilterEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm position-relative">
          <Card.Body className="p-0">
            <div className="table-box">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Çalışan</th>
                      <th>Masraf Türü</th>
                      <th>Açıklama</th>
                      <th>Tutar</th>
                      <th>Masraf Tarihi</th>
                      <th>Durum</th>
                      <th>Oluşturma Tarihi</th>
                      <th className="text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          Masraf talebi bulunamadı
                        </td>
                      </tr>
                    ) : (
                      expenseRequests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            {request.employee?.first_name} {request.employee?.last_name}
                          </td>
                          <td>{request.expense_type?.name || '-'}</td>
                          <td>{request.description}</td>
                          <td>{formatCurrency(request.amount, request.currency)}</td>
                          <td>{formatDate(request.expense_date)}</td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>{formatDate(request.created_at)}</td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleShowDocuments(request)}
                                title="Dökümanlar"
                              >
                                <FileText size={14} />
                                {request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0) && (
                                  <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                                )}
                              </Button>
                              {request.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleApproveClick(request)}
                                    title={
                                      request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0)
                                        ? 'Döküman zorunludur. Lütfen önce döküman yükleyin.'
                                        : 'Onayla'
                                    }
                                    disabled={request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0)}
                                  >
                                    <Check size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRejectClick(request)}
                                    title="Reddet"
                                  >
                                    <X size={14} />
                                  </Button>
                                </>
                              )}
                              {request.status === 'APPROVED' && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleMarkPaidClick(request)}
                                  title="Ödendi İşaretle"
                                >
                                  <DollarSign size={14} />
                                </Button>
                              )}
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleShowDetail(request)}
                                title="Detaylar"
                              >
                                <Info size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Card.Body>
        </Card>

        {expenseRequests.length > 0 && (
          <div className="px-3 mt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => fetchExpenseRequests(page, statusFilter)}
              onPageSizeChange={(size) => {}}
            />
          </div>
        )}
      </div>

      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Masraf Talebini Onayla</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <p>
              <strong>{selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}</strong> tarafından
              yapılan <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</strong> tutarındaki
              masraf talebini onaylamak istediğinizden emin misiniz?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            İptal
          </Button>
          <Button variant="success" onClick={handleApproveConfirm}>
            Onayla
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Red Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Masraf Talebini Reddet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>
                <strong>{selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}</strong> tarafından
                yapılan <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</strong> tutarındaki
                masraf talebini reddetmek üzeresiniz.
              </p>
              <Form.Group>
                <Form.Label>Red Nedeni <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Red nedenini giriniz..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejectConfirm}
            disabled={!rejectionReason.trim()}
          >
            Reddet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ödendi Modal */}
      <Modal show={showPaidModal} onHide={() => setShowPaidModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ödendi İşaretle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <p>
                <strong>{selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}</strong> için
                onaylanmış <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</strong> tutarındaki
                masraf talebini ödendi olarak işaretleyebilirsiniz.
              </p>
              <Form.Group>
                <Form.Label>Ödeme Referansı (Opsiyonel)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ödeme referans numarası..."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaidModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleMarkPaidConfirm}>
            Ödendi İşaretle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Masraf Detayları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div className="d-flex flex-column gap-3">
              <div>
                <strong>Durum: </strong> {getStatusBadge(selectedRequest.status)}
              </div>
              {selectedRequest.status === 'APPROVED' && selectedRequest.approved_at && (
                <div>
                  <strong>Onaylanma Tarihi: </strong> {formatDate(selectedRequest.approved_at)}
                </div>
              )}
              {selectedRequest.status === 'REJECTED' && (
                <>
                  {selectedRequest.rejected_at && (
                    <div>
                      <strong>Reddedilme Tarihi: </strong> {formatDate(selectedRequest.rejected_at)}
                    </div>
                  )}
                  {selectedRequest.rejection_reason && (
                    <div>
                      <strong>Red Nedeni: </strong> {selectedRequest.rejection_reason}
                    </div>
                  )}
                </>
              )}
              {selectedRequest.status === 'PAID' && (
                <>
                  {selectedRequest.paid_at && (
                    <div>
                      <strong>Ödenme Tarihi: </strong> {formatDate(selectedRequest.paid_at)}
                    </div>
                  )}
                  {selectedRequest.payment_reference && (
                    <div>
                      <strong>Ödeme No: </strong> {selectedRequest.payment_reference}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Document Modal */}
      {selectedRequest && (
        <ExpenseDocumentModal
          show={showDocumentModal}
          onHide={handleCloseDocumentModal}
          expenseRequestId={selectedRequest.id}
          expenseAmount={selectedRequest.amount}
          requiresReceipt={selectedRequest.expense_type?.requires_receipt || false}
          isPending={selectedRequest.status === 'PENDING'}
        />
      )}
    </>
  );
};

export default AdminExpenseRequests;
