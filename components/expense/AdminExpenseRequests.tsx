"use client";
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Modal } from 'react-bootstrap';
import expenseService from '@/services/expense.service';
import { ExpenseRequest } from '@/models/hr/expense-models';
import { PageHeading } from '@/widgets';
import ExpenseDocumentModal from '@/components/expense/ExpenseDocumentModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Check, X, DollarSign, FileText } from 'react-feather';
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

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const fetchExpenseRequests = async (page: number = 1, status?: string) => {
    try {
      setIsLoading(true);
      
      const response = await expenseService.getAllExpenseRequests(
        page, 
        itemsPerPage, 
        undefined,
        status || undefined
      );
      
      if (response.data) {
        setExpenseRequests(response.data);
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
    fetchExpenseRequests(1, statusFilter);
  }, [statusFilter]);

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
    return `${amount.toFixed(2)} ${currencySymbol[currency] || currency}`;
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

      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Durum Filtrele</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="PENDING">Beklemede</option>
              <option value="APPROVED">Onaylandı</option>
              <option value="REJECTED">Reddedildi</option>
              <option value="PAID">Ödendi</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
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
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleShowDocuments(request)}
                          className="me-2"
                          title="Dökümanlar"
                        >
                          <FileText size={16} />
                          {request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0) && (
                            <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                          )}
                        </Button>
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApproveClick(request)}
                              className="me-2"
                              title={
                                request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0)
                                  ? 'Döküman zorunludur. Lütfen önce döküman yükleyin.'
                                  : 'Onayla'
                              }
                              disabled={request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0)}
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectClick(request)}
                              title="Reddet"
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkPaidClick(request)}
                            title="Ödendi İşaretle"
                          >
                            <DollarSign size={16} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Toplam {totalItems} kayıt
              </div>
              <div className="pagination">
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => fetchExpenseRequests(currentPage - 1, statusFilter)}
                >
                  Önceki
                </Button>
                <span className="mx-3">
                  Sayfa {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => fetchExpenseRequests(currentPage + 1, statusFilter)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Onay Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
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
