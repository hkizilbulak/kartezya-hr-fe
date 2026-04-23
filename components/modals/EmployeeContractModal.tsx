import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { employeeContractService, contractService } from '@/services';
import { CreateEmployeeContractRequest, UpdateEmployeeContractRequest } from '@/models/hr/hr-requests';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import { EmployeeContract } from '@/models/hr/hr-models';
import { Contract } from '@/models/hr/contract';
import FormSelectField from '@/components/FormSelectField';

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
    contract_id: 0,
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingContracts, setFetchingContracts] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (show) {
      fetchContracts();
    }
  }, [show]);

  const fetchContracts = async () => {
    try {
      setFetchingContracts(true);
      const res = await contractService.getAll({ page: 1, limit: 100 });
      if (res.data) {
        setContracts(res.data);
      }
    } catch (error) {
      toast.error('Sözleşmeler yüklenirken hata oluştu', { autoClose: 2000 });
    } finally {
      setFetchingContracts(false);
    }
  };

  useEffect(() => {
    if (isEdit && employeeContract) {
      setFormData({
        employee_id: employeeId,
        contract_id: employeeContract.contract_id || 0,
      });
    } else {
      setFormData({
        employee_id: employeeId,
        contract_id: 0,
      });
    }
    setFieldErrors({});
  }, [show, employeeContract, isEdit, employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contract_id' ? Number(value) : value
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

    if (!formData.contract_id) {
      errors.contract_id = 'Lütfen bir sözleşme seçiniz';
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

  const contractOptions = contracts.map(c => ({
    value: c.id.toString(),
    label: `${c.contract_no} - ${c.project_name} (${c.customer_contact_name})`
  }));

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading || fetchingContracts} message={fetchingContracts ? "Sözleşmeler yükleniyor..." : "Kaydediliyor..."} />

        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? 'Çalışan Sözleşmesini Düzenle' : 'Çalışana Sözleşme Ekle'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <FormSelectField
              label="Sözleşme Seçin"
              name="contract_id"
              value={formData.contract_id ? formData.contract_id.toString() : ''}
              onChange={handleInputChange}
              isInvalid={!!fieldErrors.contract_id}
            >
              <option value="">Seçiniz</option>
              {contractOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelectField>
            {fieldErrors.contract_id && (
              <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                {fieldErrors.contract_id}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading || fetchingContracts}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading || fetchingContracts}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default EmployeeContractModal;
