import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { JobPosition } from '@/models/hr/hr-models';
import { jobPositionService } from '@/services';
import { translateErrorMessage, getFieldErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';

interface JobPositionModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  jobPosition?: JobPosition | null;
  isEdit?: boolean;
}

const JobPositionModal: React.FC<JobPositionModalProps> = ({
  show,
  onHide,
  onSave,
  jobPosition = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    title: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEdit && jobPosition) {
      setFormData({
        title: jobPosition.title || ''
      });
    } else {
      setFormData({
        title: ''
      });
    }
    setError('');
    setFieldErrors({});
  }, [show, jobPosition, isEdit]);

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
    
    // Her alan için validasyon
    Object.keys(formData).forEach(fieldName => {
      const fieldValue = formData[fieldName as keyof typeof formData];
      const errorMessage = getFieldErrorMessage(fieldName, fieldValue);
      if (errorMessage) {
        errors[fieldName] = errorMessage;
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
      if (isEdit && jobPosition) {
        await jobPositionService.update(jobPosition.id, formData);
        toast.success('İş pozisyonu başarıyla güncellendi');
      } else {
        await jobPositionService.create(formData);
        toast.success('İş pozisyonu başarıyla oluşturuldu');
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
      
      // Türkçe çeviriye gönder ve toast olarak göster
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
            {isEdit ? 'İş Pozisyonu Düzenle' : 'Yeni İş Pozisyonu'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Pozisyon Adı <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Pozisyon adını giriniz"
                isInvalid={!!fieldErrors.title}
              />
              {fieldErrors.title && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                  {fieldErrors.title}
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

export default JobPositionModal;