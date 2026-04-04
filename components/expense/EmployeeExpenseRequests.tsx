"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Form } from 'react-bootstrap';
import expenseService from '@/services/expense.service';
import { ExpenseRequest } from '@/models/hr/expense-models';
import { PageHeading } from '@/widgets';
import ExpenseRequestModal from '@/components/modals/ExpenseRequestModal';
import ExpenseDocumentModal from '@/components/expense/ExpenseDocumentModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Edit, Plus, FileText, X } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

interface EmployeeExpenseRequestsProps {
  employeeId?: string;
  hideCreateButton?: boolean;
}

const EmployeeExpenseRequests: React.FC<EmployeeExpenseRequestsProps> = ({ 
  employeeId, 
  hideCreateButton = false 
}) => {
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterExpenseTypeId, setFilterExpenseTypeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);

  const fetchExpenseRequests = async (page: number = 1) => {
    try {
      setIsLoading(true);
      
      let response;
      if (employeeId) {
        response = await expenseService.getAllExpenseRequests(page, itemsPerPage, parseInt(employeeId), filterStatus, undefined, 'desc', filterExpenseTypeId, filterStartDate, filterEndDate);
      } else {
        response = await expenseService.getMyExpenseRequests(page, itemsPerPage, filterStatus, undefined, 'desc', filterExpenseTypeId, filterStartDate, filterEndDate);
      }
      
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

  const fetchExpenseTypes = async () => {
    try {
      const res: any = await expenseService.getActiveExpenseTypes();
      if (res?.data) {
        setExpenseTypes(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lastFetchedId = React.useRef<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      // Tab mount guard for Strict Mode
      if (lastFetchedId.current === employeeId) return;
      lastFetchedId.current = employeeId;
      fetchExpenseRequests(currentPage);
      fetchExpenseTypes();
    } else {
      fetchExpenseRequests(currentPage);
      fetchExpenseTypes();
    }
  }, [employeeId]);

  useEffect(() => {
    fetchExpenseRequests(1);
  }, [filterStatus, filterExpenseTypeId, filterStartDate, filterEndDate]);

  const handleShowModal = (request?: ExpenseRequest) => {
    if (request) {
      setSelectedRequest(request);
      setIsEdit(true);
    } else {
      setSelectedRequest(null);
      setIsEdit(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setIsEdit(false);
  };

  const handleSaveRequest = async (data: any) => {
    try {
      if (isEdit && selectedRequest) {
        await expenseService.updateExpenseRequest(selectedRequest.id, data);
        toast.success('Masraf talebi başarıyla güncellendi');
      } else {
        await expenseService.createExpenseRequest(data);
        toast.success('Masraf talebi başarıyla oluşturuldu');
      }
      fetchExpenseRequests(currentPage);
      handleCloseModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'İşlem sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;

    try {
      await expenseService.deleteExpenseRequest(selectedRequest.id);
      toast.success('Masraf talebi başarıyla iptal edildi');
      fetchExpenseRequests(currentPage);
      setShowDeleteConfirm(false);
      setSelectedRequest(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'İptal işlemi sırasında hata oluştu';
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
    return `${amount.toFixed(2)} ${currencySymbol[currency] || currency}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const canEdit = (request: ExpenseRequest) => {
    return request.status === 'PENDING';
  };

  const canDelete = (request: ExpenseRequest) => {
    return request.status === 'PENDING';
  };

  return (
    <>
      <LoadingOverlay show={isLoading} />
      
      <PageHeading 
        heading={employeeId ? "Çalışan Masraf Talepleri" : "Masraf Taleplerim"}
        showCreateButton={!hideCreateButton}
        showFilterButton={false}
        createButtonText="Yeni Masraf Talebi"
        onCreate={() => handleShowModal()}
      />

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2 px-3">
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="mb-1" style={{ fontSize: '13px' }}>Durum</Form.Label>
                <Form.Select 
                  size="sm" 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="PENDING">Beklemede</option>
                  <option value="APPROVED">Onaylandı</option>
                  <option value="REJECTED">Reddedildi</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="mb-1" style={{ fontSize: '13px' }}>Masraf Türü</Form.Label>
                <Form.Select 
                  size="sm"
                  value={filterExpenseTypeId}
                  onChange={(e) => setFilterExpenseTypeId(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {expenseTypes.map(et => (
                    <option key={et.id} value={et.id}>{et.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="mb-1" style={{ fontSize: '13px' }}>Başlangıç Tarihi</Form.Label>
                <Form.Control 
                  type="date" 
                  size="sm"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="mb-1" style={{ fontSize: '13px' }}>Bitiş Tarihi</Form.Label>
                <Form.Control 
                  type="date" 
                  size="sm"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
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
                    <td colSpan={7} className="text-center py-4">
                      Masraf talebi bulunamadı
                    </td>
                  </tr>
                ) : (
                  expenseRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.expense_type?.name || '-'}</td>
                      <td>{request.description}</td>
                      <td>{formatCurrency(request.amount, request.currency)}</td>
                      <td>{formatDate(request.expense_date)}</td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>{formatDate(request.created_at)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {canEdit(request) && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Düzenle"
                              onClick={() => handleShowModal(request)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            title="Dökümanlar"
                            onClick={() => handleShowDocuments(request)}
                          >
                            <FileText size={16} />
                            {request.expense_type?.requires_receipt && (!request.document_count || request.document_count === 0) && (
                              <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>!</Badge>
                            )}
                          </Button>
                          {canDelete(request) && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              title="İptal Et"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <X size={14} />
                            </Button>
                          )}
                        </div>
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
                  onClick={() => fetchExpenseRequests(currentPage - 1)}
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
                  onClick={() => fetchExpenseRequests(currentPage + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <ExpenseRequestModal
        show={showModal}
        onHide={handleCloseModal}
        onSave={handleSaveRequest}
        expenseRequest={selectedRequest}
        isEdit={isEdit}
      />

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

      {showDeleteConfirm && (
        <DeleteModal
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedRequest(null);
          }}
          onHandleDelete={handleDeleteRequest}
          title="Masraf Talebini İptal Et"
          message="Bu masraf talebini iptal etmek istediğinizden emin misiniz?"
        />
      )}
    </>
  );
};

export default EmployeeExpenseRequests;
