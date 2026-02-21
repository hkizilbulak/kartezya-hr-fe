import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { employeeGradeService, CreateEmployeeGradeRequest, lookupService } from '@/services';
import { GradeLookup } from '@/services/lookup.service';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';

interface EmployeeGradeModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  employeeId: number;
  employeeGrade?: any | null;
  isEdit?: boolean;
}

interface FormData {
  employee_id: number;
  grade_id: string;
  start_date: string;
  end_date: string;
}

const EmployeeGradeModal: React.FC<EmployeeGradeModalProps> = ({
  show,
  onHide,
  onSave,
  employeeId,
  employeeGrade = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    employee_id: employeeId,
    grade_id: '',
    start_date: '',
    end_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [grades, setGrades] = useState<GradeLookup[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Lookups'ı yükle
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const gradesRes = await lookupService.getGradesLookup();
        
        if (gradesRes.success && gradesRes.data) {
          setGrades(gradesRes.data);
        }
      } catch (error) {
        console.error('Lookups yüklenirken hata:', error);
      } finally {
        setLoadingLookups(false);
      }
    };

    if (show) {
      fetchLookups();
    }
  }, [show]);

  // Form verilerini set et
  useEffect(() => {
    if (isEdit && employeeGrade) {
      const gradeId = employeeGrade.grade_id || employeeGrade.grade?.id;
      
      setFormData({
        employee_id: employeeGrade.employee_id || employeeId,
        grade_id: gradeId ? String(gradeId) : '',
        start_date: employeeGrade.start_date ? employeeGrade.start_date.split('T')[0] : '',
        end_date: employeeGrade.end_date ? employeeGrade.end_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        employee_id: employeeId,
        grade_id: '',
        start_date: '',
        end_date: ''
      });
    }
    setFieldErrors({});
  }, [show, employeeGrade, isEdit, employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
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

    if (!formData.grade_id) {
      errors.grade_id = 'Grade zorunludur';
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
      const submitData: CreateEmployeeGradeRequest = {
        employee_id: formData.employee_id,
        grade_id: parseInt(formData.grade_id),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined
      };

      if (isEdit && employeeGrade) {
        await employeeGradeService.update(employeeGrade.id, submitData);
        toast.success('Grade bilgisi başarıyla güncellendi');
      } else {
        await employeeGradeService.create(submitData);
        toast.success('Grade bilgisi başarıyla oluşturuldu');
      }
      onSave();
      onHide();
    } catch (error: any) {
      let errorMessage = '';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
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
            {isEdit ? 'Grade Bilgisi Düzenle' : 'Yeni Grade Bilgisi'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Grade <span className="text-danger">*</span></Form.Label>
                  <FormSelectField
                    name="grade_id"
                    value={formData.grade_id}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.grade_id}
                    disabled={loadingLookups}
                  >
                    <option value="">Grade seçiniz</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={String(grade.id)}>
                        {grade.name}
                      </option>
                    ))}
                  </FormSelectField>
                  {fieldErrors.grade_id && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.grade_id}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <FormDateField
                  label="Başlama Tarihi"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  isInvalid={!!fieldErrors.start_date}
                  errorMessage={fieldErrors.start_date}
                />
              </Col>
              <Col md={6}>
                <FormDateField
                  label="Bitiş Tarihi"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading || loadingLookups}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading || loadingLookups}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default EmployeeGradeModal;
