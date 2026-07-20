'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import { Job } from '@/models/hr/job-models';

const PAST_DATE_SUPPORTED_JOB_KEYS = new Set([
  'leave_balance_job',
  'work_day_report_job',
]);

type RunMode = 'now' | 'past';

type RunJobModalProps = {
  show: boolean;
  job: Job;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (referenceDate?: string) => void;
};

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}.${month}.${year}`;
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > todayISO();
}

export default function RunJobModal({
  show,
  job,
  loading = false,
  onClose,
  onConfirm,
}: RunJobModalProps) {
  const [runMode, setRunMode] = useState<RunMode>('now');
  const [referenceDate, setReferenceDate] = useState('');

  const supportsPastDate = PAST_DATE_SUPPORTED_JOB_KEYS.has(job.job_key);

  useEffect(() => {
    if (show) {
      setRunMode('now');
      setReferenceDate('');
    }
  }, [show, job.id]);

  const confirmDisabled = useMemo(() => {
    if (loading) return true;
    if (runMode === 'past') {
      if (!referenceDate || isFutureDate(referenceDate)) return true;
    }
    return false;
  }, [loading, runMode, referenceDate]);

  const message = useMemo(() => {
    if (runMode === 'past' && referenceDate) {
      return `"${job.name}" görevi ${formatDateForDisplay(referenceDate)} tarihi için çalıştırılacak. Devam etmek istediğinizden emin misiniz?`;
    }
    return `"${job.name}" görevi çalıştırılacak. Devam etmek istediğinizden emin misiniz?`;
  }, [job.name, runMode, referenceDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => {
    const value = e.target.value;
    if (value && isFutureDate(value)) {
      return;
    }
    setReferenceDate(value);
  };

  const handleConfirm = () => {
    if (confirmDisabled) return;
    if (runMode === 'past') {
      onConfirm(referenceDate);
      return;
    }
    onConfirm();
  };

  return (
    <Modal show={show} onHide={onClose} size="sm">
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Çalıştırılıyor..." />

        <Modal.Header closeButton={!loading}>
          <Modal.Title>Görevi Çalıştır</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{message}</p>

          {supportsPastDate && (
            <Form.Group className="mb-0">
              <Form.Check
                type="radio"
                id={`run-mode-now-${job.id}`}
                name="runMode"
                label="Şimdi çalıştır"
                checked={runMode === 'now'}
                onChange={() => setRunMode('now')}
                disabled={loading}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id={`run-mode-past-${job.id}`}
                name="runMode"
                label="Geçmiş tarih için çalıştır"
                checked={runMode === 'past'}
                onChange={() => setRunMode('past')}
                disabled={loading}
                className="mb-2"
              />
              {runMode === 'past' && (
                <FormDateField
                  label="Referans Tarihi"
                  name="reference_date"
                  value={referenceDate}
                  onChange={handleDateChange}
                  required
                  disabled={loading}
                />
              )}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button variant="success" onClick={handleConfirm} disabled={confirmDisabled}>
            {loading ? 'Çalıştırılıyor...' : 'Çalıştır'}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}

export { PAST_DATE_SUPPORTED_JOB_KEYS, formatDateForDisplay, todayISO, isFutureDate };
