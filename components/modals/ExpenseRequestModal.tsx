import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { IMaskInput } from 'react-imask';
import { ExpenseRequest, Currency } from '@/models/hr/expense-models';
import expenseService from '@/services/expense.service';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';

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

    setLoading(true);
    try {
      const submitData = {
        expense_type_id: parseInt(formData.expense_type_id),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        expense_date: formData.expense_date,
        description: formData.description
      };
  
      await onSave(submitData);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = expenseTypes.find(t => t.id.toString() === formData.expense_type_id);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />
        
        <Modal.Header closeButton>
          <Modal.Title className="fw-600">
            {isEdit ? 'Masraf Talebini Düzenle' : 'Yeni Masraf Talebi'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-3">
            
            <Form.Group className="mb-3">
              <Form.Label>
                Masraf Türü <span className="text-danger">*</span>
              </Form.Label>
              <FormSelectField
                name="expense_type_id"
                value={formData.expense_type_id}
                onChange={(e: any) => handleChange('expense_type_id', e.target.value)}
                isInvalid={!!fieldErrors.expense_type_id}
                errorMessage={fieldErrors.expense_type_id}
              >
                <option value="">Seçiniz...</option>
                {expenseTypes.map(type => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name}{type.max_amount ? ` (Max: ${type.max_amount})` : ''}
                  </option>
                ))}
              </FormSelectField>
            </Form.Group>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tutar <span className="text-danger">*</span>
                  </Form.Label>
                  <IMaskInput
                    className={`form-control${fieldErrors.amount ? ' is-invalid' : ''}`}
                    mask={Number}
                    scale={2}
                    padFractionalZeros={true}
                    normalizeZeros={true}
                    radix=","
                    mapToRadix={['.']}
                    thousandsSeparator="."
                    value={String(formData.amount)}
                    unmask={true}
                    onAccept={(value) => handleChange('amount', value)}
                    placeholder="0,00"
                  />
                  {fieldErrors.amount && (
                    <div className="invalid-feedback d-block">
                      {fieldErrors.amount}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Para Birimi <span className="text-danger">*</span>
                  </Form.Label>
                  <FormSelectField
                    name="currency"
                    value={formData.currency}
                    onChange={(e: any) => handleChange('currency', e.target.value)}
                    isInvalid={false}
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </FormSelectField>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <FormDateField
                label="Masraf Tarihi"
                name="expense_date"
                value={formData.expense_date}
                onChange={(e: any) => handleChange('expense_date', e.target.value)}
                isInvalid={!!fieldErrors.expense_date}
                errorMessage={fieldErrors.expense_date}
                required={true}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Açıklama <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={(e: any) => handleChange('description', e.target.value)}
                isInvalid={!!fieldErrors.description}
                placeholder="Masraf açıklamasını yazınız"
                size="sm"
              />
              {fieldErrors.description && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.description}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {selectedType?.requires_receipt && (
              <Alert variant="info">
                <strong>Bilgi: </strong> Bu masraf türü için makbuz/fatura eklemek zorunludur.
              </Alert>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              İptal
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Talep Oluştur'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default ExpenseRequestModal;
