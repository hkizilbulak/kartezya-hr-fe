import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { cvSearchService } from '@/services/cv-search.service';
import { toast } from 'react-toastify';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormSelectField from '@/components/FormSelectField';
import FormDateField from '@/components/FormDateField';
import type { Interview, InterviewRequest } from '@/models/cv-search/cv-search.models';

interface InterviewModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  candidateId: number;
  interviewToEdit?: Interview | null;
}

const INTERVIEW_TYPES = [
  { value: 'technical', label: 'Teknik Ön Görüşme' },
  { value: 'case_study', label: 'Kurum Görüşmesi' },
  { value: 'hr', label: 'İK' },
  { value: 'other', label: 'Diğer' },
];

const OUTCOMES = [
  { value: 'pre_interview', label: 'Ön Görüşme' },
  { value: 'interview', label: 'Görüşme' },
  { value: 'decision_pending', label: 'Karar bekleniyor' },
  { value: 'hired', label: 'İşe alım' },
  { value: 'rejected_pre_interview', label: 'Elendi(Ön Görüşme)' },
  { value: 'rejected_interview', label: 'Elendi(Görüşme)' },
  { value: 'withdrawn', label: 'Süreçten Çekildi' },
  { value: 'reserved', label: 'Reserve edildi' },
  { value: 'different_account', label: 'Farklı ekipte değerlendirilebilir' },
  { value: 'contact_for_slot', label: 'Slot için İletişim' }
];

const emptyForm = (): InterviewRequest => ({
  interview_date: '',
  interview_type: '',
  interviewer_name: '',
  team: '',
  outcome: 'reserved',
  notes: '',
});

const InterviewModal: React.FC<InterviewModalProps> = ({
  show,
  onHide,
  onSave,
  candidateId,
  interviewToEdit = null,
}) => {
  const isEdit = !!interviewToEdit;
  const [formData, setFormData] = useState<InterviewRequest>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ interview_date?: string; interview_type?: string }>({});

  useEffect(() => {
    if (show) {
      if (isEdit && interviewToEdit) {
        let safeOutcome = interviewToEdit.outcome ?? 'reserved';
        if (safeOutcome === 'passed') safeOutcome = 'decision_pending';
        else if (safeOutcome === 'failed') safeOutcome = 'rejected_interview';
        else if (safeOutcome === 'pending' || safeOutcome === 'reserved_future_hire') safeOutcome = 'reserved';
        else if (!OUTCOMES.some(o => o.value === safeOutcome)) {
          safeOutcome = 'reserved';
        }

        setFormData({
          interview_date: interviewToEdit.interview_date?.slice(0, 10) ?? '',
          interview_type: interviewToEdit.interview_type ?? '',
          interviewer_name: interviewToEdit.interviewer_name ?? '',
          team: interviewToEdit.team ?? '',
          outcome: safeOutcome,
          notes: interviewToEdit.notes ?? '',
        });
      } else {
        setFormData(emptyForm());
      }
      setErrors({});
    }
  }, [show, interviewToEdit, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'interview_type' && value !== 'case_study') {
        next.team = '';
      }
      return next;
    });
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: typeof errors = {};

    if (!formData.interview_date) {
      newErrors.interview_date = 'Görüşme tarihi zorunludur.';
      isValid = false;
    }
    
    if (!formData.interview_type) {
      newErrors.interview_type = 'Görüşme türü zorunludur.';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit && interviewToEdit) {
        await cvSearchService.updateInterview(candidateId, interviewToEdit.id, formData);
        toast.success('Görüşme başarıyla güncellendi.');
      } else {
        await cvSearchService.createInterview(candidateId, formData);
        toast.success('Görüşme başarıyla eklendi.');
      }
      onSave();
      onHide();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Bir hata oluştu.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Görüşmeyi Düzenle' : 'Yeni Görüşme Ekle'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <FormDateField
                  label="Görüşme Tarihi"
                  name="interview_date"
                  value={formData.interview_date}
                  onChange={handleChange as any}
                  isInvalid={!!errors.interview_date}
                  errorMessage={errors.interview_date}
                  required={true}
                />
              </Col>
              <Col md={6}>
                <FormSelectField
                  label="Görüşme Türü"
                  name="interview_type"
                  value={formData.interview_type}
                  onChange={handleChange as any}
                  isInvalid={!!errors.interview_type}
                  errorMessage={errors.interview_type}
                >
                  <option value="">Seçiniz...</option>
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </FormSelectField>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Görüşmeci</Form.Label>
                  <Form.Control
                    type="text"
                    name="interviewer_name"
                    value={formData.interviewer_name}
                    onChange={handleChange}
                    placeholder="Görüşmeci adı"
                  />
                </Form.Group>
              </Col>
              {formData.interview_type === 'case_study' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ekip</Form.Label>
                    <Form.Control
                      type="text"
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      placeholder="Ekip adı"
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <FormSelectField
                  label="Sonuç"
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange as any}
                >
                  {OUTCOMES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </FormSelectField>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Görüşme notları..."
              />
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

export default InterviewModal;
