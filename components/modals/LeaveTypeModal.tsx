import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { leaveTypeService, LeaveType } from '@/services/leave-type.service';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';

interface LeaveTypeModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  leaveType?: LeaveType | null;
  isEdit?: boolean;
}

const LeaveTypeModal: React.FC<LeaveTypeModalProps> = ({
  show,
  onHide,
  onSave,
  leaveType = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_paid: false,
    is_limited: false,
    is_accrual: false,
    is_required_document: false
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEdit && leaveType) {
      setFormData({
        name: leaveType.name || '',
        description: leaveType.description || '',
        is_paid: !!leaveType.is_paid,
        is_limited: !!leaveType.is_limited,
        is_accrual: !!leaveType.is_accrual,
        is_required_document: !!leaveType.is_required_document
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_paid: false,
        is_limited: false,
        is_accrual: false,
        is_required_document: false
      });
    }
    setFieldErrors({});
  }, [show, leaveType, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const val: any = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    const requiredFields = ['name'];
    requiredFields.forEach(fieldName => {
      const fieldValue = formData[fieldName as keyof typeof formData];
      const errorMessage = getFieldErrorMessage(fieldName, String(fieldValue));
      if (errorMessage) errors[fieldName] = errorMessage;
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isEdit && leaveType) {
        await leaveTypeService.update(leaveType.id, formData);
        toast.success('İzin türü başarıyla güncellendi');
      } else {
        await leaveTypeService.create(formData);
        toast.success('İzin türü başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Bir hata oluştu';
      }
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'İzin Türü Düzenle' : 'Yeni İzin Türü'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>İzin Türü <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="İzin türü adını giriniz"
                    isInvalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>{fieldErrors.name}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Açıklama</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Açıklama giriniz"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Ücretli"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Limitli"
                    name="is_limited"
                    checked={formData.is_limited}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Devredilebilir"
                    name="is_accrual"
                    checked={formData.is_accrual}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Belge Gerekli"
                    name="is_required_document"
                    checked={formData.is_required_document}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default LeaveTypeModal;
