"use client";
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import expenseService from '@/services/expense.service';
import { ExpenseType } from '@/models/hr/expense-models';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import DeleteModal from '@/components/DeleteModal';
import { Edit, Trash2, Plus } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

const ExpenseTypeManagement: React.FC = () => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requires_receipt: false,
    max_amount: '',
    active: true
  });

  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  const fetchExpenseTypes = async () => {
    try {
      setIsLoading(true);
      const response = await expenseService.getExpenseTypes();
      if (response.data) {
        setExpenseTypes(response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowModal = (type?: ExpenseType) => {
    if (type) {
      setSelectedType(type);
      setFormData({
        name: type.name,
        description: type.description,
        requires_receipt: type.requires_receipt,
        max_amount: type.max_amount?.toString() || '',
        active: type.active
      });
      setIsEdit(true);
    } else {
      setSelectedType(null);
      setFormData({
        name: '',
        description: '',
        requires_receipt: false,
        max_amount: '',
        active: true
      });
      setIsEdit(false);
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedType(null);
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.name?.trim()) {
      errors.name = 'Masraf türü adı giriniz';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Açıklama giriniz';
    }

    if (formData.max_amount && parseFloat(formData.max_amount) <= 0) {
      errors.max_amount = 'Geçerli bir tutar giriniz';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        requires_receipt: formData.requires_receipt,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : undefined,
        active: formData.active
      };

      if (isEdit && selectedType) {
        await expenseService.updateExpenseType(selectedType.id, submitData);
        toast.success('Masraf türü başarıyla güncellendi');
      } else {
        await expenseService.createExpenseType(submitData as any);
        toast.success('Masraf türü başarıyla oluşturuldu');
      }

      fetchExpenseTypes();
      handleCloseModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'İşlem sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      await expenseService.deleteExpenseType(selectedType.id);
      toast.success('Masraf türü başarıyla silindi');
      fetchExpenseTypes();
      setShowDeleteModal(false);
      setSelectedType(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Silme işlemi başarısız';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return `${amount.toFixed(2)} ₺`;
  };

  return (
    <>
      <LoadingOverlay show={isLoading} />
      
      <PageHeading 
        heading="Masraf Türleri Yönetimi"
        showCreateButton={true}
        showFilterButton={false}
        createButtonText="Yeni Masraf Türü"
        onCreate={() => handleShowModal()}
      />

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Açıklama</th>
                  <th>Maksimum Tutar</th>
                  <th>Makbuz Gerekli</th>
                  <th>Durum</th>
                  <th className="text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {expenseTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Masraf türü bulunamadı
                    </td>
                  </tr>
                ) : (
                  expenseTypes.map((type) => (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>{type.description}</td>
                      <td>{formatCurrency(type.max_amount)}</td>
                      <td>
                        <Badge bg={type.requires_receipt ? 'success' : 'secondary'}>
                          {type.requires_receipt ? 'Evet' : 'Hayır'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={type.active ? 'success' : 'danger'}>
                          {type.active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleShowModal(type)}
                          className="p-1 me-2"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-danger"
                          onClick={() => {
                            setSelectedType(type);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? 'Masraf Türünü Düzenle' : 'Yeni Masraf Türü'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Ad <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isInvalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.name}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Açıklama <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                isInvalid={!!fieldErrors.description}
              />
              {fieldErrors.description && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.description}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Maksimum Tutar (TRY)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.max_amount}
                onChange={(e) => setFormData({...formData, max_amount: e.target.value})}
                isInvalid={!!fieldErrors.max_amount}
                placeholder="Boş bırakılırsa limit yok"
              />
              {fieldErrors.max_amount && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.max_amount}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Makbuz/Fatura Gerekli"
                checked={formData.requires_receipt}
                onChange={(e) => setFormData({...formData, requires_receipt: e.target.checked})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Aktif"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              {isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedType(null);
          }}
          onHandleDelete={handleDelete}
          title="Masraf Türünü Sil"
          message="Bu masraf türünü silmek istediğinizden emin misiniz?"
        />
      )}
    </>
  );
};

export default ExpenseTypeManagement;
