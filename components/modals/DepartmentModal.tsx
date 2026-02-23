import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Department } from '@/models/hr/hr-models';
import { CreateDepartmentRequest, UpdateDepartmentRequest } from '@/models/hr/hr-requests';
import { departmentService, lookupService } from '@/services';
import { CompanyLookup } from '@/services/lookup.service';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';

interface DepartmentModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  department?: Department | null;
  isEdit?: boolean;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  show,
  onHide,
  onSave,
  department = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    name: '',
    company_id: 0,
    manager: ''
  });
  const [companies, setCompanies] = useState<CompanyLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (show) {
      fetchCompanies();
    }
  }, [show]);

  useEffect(() => {
    if (isEdit && department) {
      setFormData({
        name: department.name || '',
        company_id: department.company?.id || department.company_id || 0,
        manager: department.manager || '',
      });
    } else {
      setFormData({
        name: '',
        company_id: 0,
        manager: ''
      });
    }
    setFieldErrors({});
  }, [show, department, isEdit]);

  const fetchCompanies = async () => {
    try {
      const response = await lookupService.getCompaniesLookup();
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Şirketler yüklenemedi');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'company_id' ? parseInt(value) || 0 : value
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
    
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Departman adı zorunludur';
    }
    if (!formData.company_id || formData.company_id <= 0) {
      errors.company_id = 'Şirket seçimi zorunludur';
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
      if (isEdit && department) {
        const updateRequest: UpdateDepartmentRequest = {
          ...formData,
          id: department.id
        };
        await departmentService.update(department.id, updateRequest);
        toast.success('Departman başarıyla güncellendi');
      } else {
        const createRequest: CreateDepartmentRequest = formData;
        await departmentService.create(createRequest);
        toast.success('Departman başarıyla oluşturuldu');
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
            {isEdit ? 'Departman Düzenle' : 'Yeni Departman'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Şirket <span className="text-danger">*</span></Form.Label>
              <FormSelectField
                name="company_id"
                value={formData.company_id.toString()}
                onChange={handleInputChange}
                isInvalid={!!fieldErrors.company_id}
              >
                <option value="0">Şirket seçiniz</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id.toString()}>
                    {company.name}
                  </option>
                ))}
              </FormSelectField>
              {fieldErrors.company_id && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.company_id}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Departman Adı <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Departman adı giriniz"
                isInvalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.name}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Yönetici Adı</Form.Label>
              <Form.Control
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleInputChange}
                placeholder="Yönetici adı giriniz"
                isInvalid={!!fieldErrors.manager}
              />
              {fieldErrors.name && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.manager}
                </div>
              )}
            </Form.Group>
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

export default DepartmentModal;