import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { employeeGradeService, lookupService } from '@/services';
import { GradeLookup } from '@/services/lookup.service';
import { CreateEmployeeGradeRequest, UpdateEmployeeGradeRequest } from '@/models/hr/hr-requests';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import { EmployeeGrade, isActiveEmployeeGrade } from '@/models/hr/hr-models';

interface EmployeeGradeModalProps {
  show: boolean;
  onHide: () => void;
  /** Called after successful API; await refreshes before toast/close. */
  onSave: () => void | Promise<void>;
  employeeId: number;
  employeeGrade?: EmployeeGrade | null;
  isEdit?: boolean;
}

/** Prefer date-only YYYY-MM-DD; avoid timezone day-shift via Date parsing. */
function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
}

const EmployeeGradeModal: React.FC<EmployeeGradeModalProps> = ({
  show,
  onHide,
  onSave,
  employeeId,
  employeeGrade = null,
  isEdit = false
}) => {
  const [gradeId, setGradeId] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [grades, setGrades] = useState<GradeLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const isActiveEdit = isEdit && !!employeeGrade && isActiveEmployeeGrade(employeeGrade);
  const isHistoryEdit = isEdit && !!employeeGrade && !isActiveEdit;
  const isGradeEdit = isActiveEdit || isHistoryEdit;

  useEffect(() => {
    if (show) {
      fetchGrades();
    }
  }, [show]);

  useEffect(() => {
    if (isGradeEdit && employeeGrade) {
      setGradeId(employeeGrade.grade?.id || employeeGrade.grade_id || 0);
      setStartDate(toDateInputValue(employeeGrade.start_date));
      setEndDate(toDateInputValue(employeeGrade.end_date));
    } else {
      setGradeId(0);
      setStartDate('');
      setEndDate('');
    }
    setFieldErrors({});
  }, [show, employeeGrade, isEdit, employeeId, isGradeEdit]);

  const fetchGrades = async () => {
    try {
      const response = await lookupService.getGradesLookup();
      setGrades(response.data || []);
    } catch {
      toast.error('Gradeler yüklenemedi');
    }
  };

  const clearFieldError = (name: string) => {
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!gradeId || gradeId <= 0) {
      errors.grade_id = 'Grade seçimi zorunludur';
    }
    if (!startDate) {
      errors.start_date = 'Başlama tarihi zorunludur';
    }
    if (isHistoryEdit) {
      if (!endDate) {
        errors.end_date = 'Bitiş tarihi zorunludur';
      } else if (startDate && endDate < startDate) {
        errors.end_date = 'Bitiş tarihi başlama tarihinden önce olamaz';
      }
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
      if (isGradeEdit && employeeGrade) {
        const updateRequest: UpdateEmployeeGradeRequest = {
          id: employeeGrade.id,
          employee_id: employeeId,
          grade_id: gradeId,
          start_date: startDate,
          end_date: isHistoryEdit ? endDate : '',
        };
        await employeeGradeService.update(employeeGrade.id, updateRequest);
        await onSave();
        toast.success('Grade bilgisi başarıyla güncellendi');
      } else {
        const createRequest: CreateEmployeeGradeRequest = {
          employee_id: employeeId,
          grade_id: gradeId,
          start_date: startDate,
        };
        await employeeGradeService.create(createRequest);
        await onSave();
        toast.success('Yeni grade başarıyla atandı');
      }
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
          <Modal.Title>
            {isActiveEdit ? 'Aktif Grade Düzenle' : isHistoryEdit ? 'Grade Geçmişini Düzenle' : 'Yeni Grade Ata'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {!isGradeEdit && (
              <Alert variant="info" className="py-2">
                Yeni grade atandığında mevcut aktif grade otomatik olarak kapatılır.
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Grade <span className="text-danger">*</span></Form.Label>
              <FormSelectField
                name="grade_id"
                value={gradeId.toString()}
                onChange={(e) => {
                  setGradeId(parseInt(e.target.value, 10) || 0);
                  clearFieldError('grade_id');
                }}
                isInvalid={!!fieldErrors.grade_id}
              >
                <option value="0">Grade seçiniz</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id.toString()}>
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

            <Row className="mb-3">
              <Col md={isHistoryEdit ? 6 : 12}>
                <FormDateField
                  label="Başlama Tarihi"
                  name="start_date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    clearFieldError('start_date');
                  }}
                  required
                />
                {fieldErrors.start_date && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                    {fieldErrors.start_date}
                  </div>
                )}
              </Col>
              {isHistoryEdit && (
                <Col md={6}>
                  <FormDateField
                    label="Bitiş Tarihi"
                    name="end_date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      clearFieldError('end_date');
                    }}
                    required
                  />
                  {fieldErrors.end_date && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {fieldErrors.end_date}
                    </div>
                  )}
                </Col>
              )}
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

export default EmployeeGradeModal;
