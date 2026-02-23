import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import InputMask from 'react-input-mask';
import { Company } from '@/models/hr/hr-models';
import { CreateCompanyRequest, UpdateCompanyRequest } from '@/models/hr/hr-requests';
import { companyService } from '@/services';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';

interface CompanyModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  company?: Company | null;
  isEdit?: boolean;
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  show,
  onHide,
  onSave,
  company = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEdit && company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: ''
      });
    }
    setError('');
    setFieldErrors({});
  }, [show, company, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Anlık validasyon - hata varsa temizle
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    Object.keys(formData).forEach(fieldName => {
      const fieldValue = formData[fieldName as keyof CreateCompanyRequest];
      if (fieldValue !== undefined) {
        const errorMessage = getFieldErrorMessage(fieldName, fieldValue);
        if (errorMessage) {
          errors[fieldName] = errorMessage;
        }
      }
    });

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
      if (isEdit && company) {
        const updateRequest: UpdateCompanyRequest = {
          ...formData,
          id: company.id
        };
        await companyService.update(company.id, updateRequest);
        toast.success('Şirket başarıyla güncellendi');
      } else {
        const createRequest: CreateCompanyRequest = formData;
        await companyService.create(createRequest);
        toast.success('Şirket başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';
      
      // Farklı hata formatlarını kontrol et
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
            {isEdit ? 'Şirket Düzenle' : 'Yeni Şirket'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Şirket Adı <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Şirket adını giriniz"
                isInvalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.name}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>E-posta</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="E-posta adresini giriniz"
                isInvalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.email}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefon</Form.Label>
              <InputMask
                mask="(999) 999 9999"
                value={formData.phone}
                onChange={handleInputChange}
              >
                {(inputProps: any) => (
                  <Form.Control
                    {...inputProps}
                    type="tel"
                    name="phone"
                    placeholder="(123) 111 1111"
                    isInvalid={!!fieldErrors.phone}
                  />
                )}
              </InputMask>
              {fieldErrors.phone && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.phone}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Website adresini giriniz"
                isInvalid={!!fieldErrors.website}
              />
              {fieldErrors.website && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.website}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Adres</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adres bilgisini giriniz"
                isInvalid={!!fieldErrors.address}
              />
              {fieldErrors.address && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.address}
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

export default CompanyModal;