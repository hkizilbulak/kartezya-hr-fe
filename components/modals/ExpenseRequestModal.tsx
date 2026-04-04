"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { ExpenseRequest, Currency } from '@/models/hr/expense-models';
import expenseService from '@/services/expense.service';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import LoadingOverlay from '@/components/LoadingOverlay';

interface ExpenseRequestModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (data: any) => void;
  expenseRequest?: ExpenseRequest | null;
  isEdit?: boolean;
}

const ExpenseRequestModal: React.FC<ExpenseRequestModalProps> = ({
  show,
  onHide,
  expenseRequest = null,
  isEdit = false,
  onSave
}) => {
  const [formData, setFormData] = useState({
    expense_type_id: '',
    amount: '',
    currency: 'TRY',
    expense_date: '',
    description: ''
  });
  
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (show) {
      fetchExpenseTypes();
    }
  }, [show]);

  useEffect(() => {
    if (show && isEdit && expenseRequest) {
      setFormData({
        expense_type_id: expenseRequest.expense_type_id?.toString() || '',
        amount: expenseRequest.amount?.toString() || '',
        currency: expenseRequest.currency || 'TRY',
        expense_date: expenseRequest.expense_date?.split('T')[0] || '',
        description: expenseRequest.description || ''
      });
      setFieldErrors({});
    } else if (show && !isEdit) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        expense_type_id: '',
        amount: '',
        currency: 'TRY',
        expense_date: today,
        description: ''
      });
      setFieldErrors({});
    }
  }, [show, expenseRequest, isEdit]);

  const fetchExpenseTypes = async () => {
    try {
      const response = await expenseService.getActiveExpenseTypes();
      if (response.data) {
        setExpenseTypes(response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Masraf türleri yüklenemedi';
      toast.error(translateErrorMessage(errorMessage));
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.expense_type_id) {
      errors.expense_type_id = 'Masraf türü seçiniz';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Geçerli bir tutar giriniz';
    }

    if (!formData.expense_date) {
      errors.expense_date = 'Masraf tarihi seçiniz';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Açıklama giriniz';
    }

    // Check max amount if expense type has limit
    const selectedType = expenseTypes.find(t => t.id.toString() === formData.expense_type_id);
    if (selectedType?.max_amount && parseFloat(formData.amount) > selectedType.max_amount) {
      errors.amount = `Maksimum tutar: ${selectedType.max_amount} ${formData.currency}`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      expense_type_id: parseInt(formData.expense_type_id),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      expense_date: formData.expense_date,
      description: formData.description
    };

    onSave(submitData);
  };

  const selectedType = expenseTypes.find(t => t.id.toString() === formData.expense_type_id);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEdit ? 'Masraf Talebini Düzenle' : 'Yeni Masraf Talebi'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <LoadingOverlay show={loading} message="İşlem yapılıyor..." />
          
          <Form.Group className="mb-3">
            <Form.Label>
              Masraf Türü <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={formData.expense_type_id}
              onChange={(e) => handleChange('expense_type_id', e.target.value)}
              isInvalid={!!fieldErrors.expense_type_id}
            >
              <option value="">Seçiniz...</option>
              {expenseTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}{type.max_amount ? ` (Max: ${type.max_amount})` : ''}
                </option>
              ))}
            </Form.Select>
            {fieldErrors.expense_type_id && (
              <Form.Control.Feedback type="invalid">
                {fieldErrors.expense_type_id}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tutar <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  isInvalid={!!fieldErrors.amount}
                />
                {fieldErrors.amount && (
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.amount}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Para Birimi <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              Masraf Tarihi <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              value={formData.expense_date}
              onChange={(e) => handleChange('expense_date', e.target.value)}
              isInvalid={!!fieldErrors.expense_date}
            />
            {fieldErrors.expense_date && (
              <Form.Control.Feedback type="invalid">
                {fieldErrors.expense_date}
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
              onChange={(e) => handleChange('description', e.target.value)}
              isInvalid={!!fieldErrors.description}
            />
            {fieldErrors.description && (
              <Form.Control.Feedback type="invalid">
                {fieldErrors.description}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          {selectedType?.requires_receipt && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Bu masraf türü için makbuz/fatura eklemek zorunludur.
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            İptal
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {isEdit ? 'Güncelle' : 'Oluştur'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ExpenseRequestModal;
