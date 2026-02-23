import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { employeeContractService } from '@/services';
import { CreateEmployeeContractRequest, UpdateEmployeeContractRequest } from '@/models/hr/hr-requests';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import { EmployeeContract } from '@/models/hr/hr-models';

interface EmployeeContractModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  employeeId: number;
  employeeContract?: EmployeeContract | null;
  isEdit?: boolean;
}

const EmployeeContractModal: React.FC<EmployeeContractModalProps> = ({
  show,
  onHide,
  onSave,
  employeeId,
  employeeContract = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateEmployeeContractRequest>({
    employee_id: employeeId,
    contract_no: '',
    start_date: '',
    end_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEdit && employeeContract) {
      setFormData({
        employee_id: employeeId,
        contract_no: employeeContract.contract_no || '',
        start_date: employeeContract.start_date ? employeeContract.start_date.split('T')[0] : '',
        end_date: employeeContract.end_date ? employeeContract.end_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        employee_id: employeeId,
        contract_no: '',
        start_date: '',
        end_date: ''
      });
    }
    setFieldErrors({});
  }, [show, employeeContract, isEdit, employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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

    if (!formData.contract_no || !formData.contract_no.trim()) {
      errors.contract_no = 'Sözleşme numarası zorunludur';
    }
    if (!formData.start_date) {
      errors.start_date = 'Başlama tarihi zorunludur';
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
      if (isEdit && employeeContract) {
        const updateRequest: UpdateEmployeeContractRequest = {
          ...formData,
          id: employeeContract.id
        };
        await employeeContractService.update(employeeContract.id, updateRequest);
        toast.success('Sözleşme başarıyla güncellendi');
      } else {
        const createRequest: CreateEmployeeContractRequest = formData;
        await employeeContractService.create(createRequest);
        toast.success('Sözleşme başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';

      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.message) {
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

      const translatedError = translateErrorMessage(errorMessage);
      toast.error(translatedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />

        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? 'Sözleşmeyi Düzenle' : 'Yeni Sözleşme Ekle'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Sözleşme No <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="contract_no"
                value={formData.contract_no}
                onChange={handleInputChange}
                placeholder="Sözleşme numarasını giriniz"
                isInvalid={!!fieldErrors.contract_no}
              />
              {fieldErrors.contract_no && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.contract_no}
                </div>
              )}
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <FormDateField
                  label="Başlangıç Tarihi"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.start_date && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                    {fieldErrors.start_date}
                  </div>
                )}
              </Col>
              <Col md={6}>
                <FormDateField
                  label="Bitiş Tarihi"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default EmployeeContractModal;
