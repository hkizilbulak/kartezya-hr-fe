"use client";
import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Job } from '@/models/hr/job-models';
import { jobService } from '@/services/job.service';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

interface JobModalProps {
  show: boolean;
  job: Job;
  onHide: () => void;
  onSave: () => void;
}

const JobModal = ({ show, job, onHide, onSave }: JobModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cron_expression: '',
    is_active: true,
    timeout_second: 3600
  });

  useEffect(() => {
    if (show && job) {
      setFormData({
        cron_expression: job.cron_expression || '',
        is_active: job.is_active ?? true,
        timeout_second: job.timeout_second || 3600
      });
    }
  }, [show, job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await jobService.updateJob(job.id, formData);
      toast.success('Görev başarıyla güncellendi');
      onSave();
      onHide();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Güncelleme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Görevi Düzenle: {job?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Job Key</Form.Label>
            <Form.Control
              type="text"
              value={job?.job_key || ''}
              disabled
            />
            <Form.Text className="text-muted">Job key değiştirilemez.</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cron İfadesi</Form.Label>
            <Form.Control
              type="text"
              name="cron_expression"
              value={formData.cron_expression}
              onChange={handleChange}
              required
            />
            <Form.Text className="text-muted">Örnek: 0 0 * * * (Her gün gece 12'de çalışır)</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Timeout Süresi (Saniye)</Form.Label>
            <Form.Control
              type="number"
              name="timeout_second"
              value={formData.timeout_second}
              onChange={handleNumberChange}
              required
              min="1"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="is_active_switch"
              label="Aktif / Pasif"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
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
    </Modal>
  );
};

export default JobModal;
