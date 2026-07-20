"use client";
import { Modal, Button } from 'react-bootstrap';
import { JobHistory } from '@/models/hr/job-models';

interface JobHistoryModalProps {
  show: boolean;
  history: JobHistory;
  onHide: () => void;
}

const EXECUTION_TYPE_LABELS: Record<string, string> = {
  scheduled: 'Zamanlanmış',
  manual: 'Manuel',
  manual_backfill: 'Geriye Dönük Manuel',
};

function formatReferenceDate(value?: string): string {
  if (!value) return '-';
  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '-';
  return `${day}.${month}.${year}`;
}

function getExecutionTypeLabel(value?: string): string {
  if (!value) return '-';
  return EXECUTION_TYPE_LABELS[value] || value;
}

const JobHistoryModal = ({ show, history, onHide }: JobHistoryModalProps) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>İşlem Detayları</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <strong>Durum:</strong> 
          <span className={`ms-2 badge ${history?.status === 'SUCCESS' ? 'bg-success' : 'bg-danger'}`}>
            {history?.status}
          </span>
        </div>
        <div className="mb-3">
          <strong>Başlangıç Zamanı:</strong> {history?.start_time ? new Date(history.start_time).toLocaleString() : '-'}
        </div>
        <div className="mb-3">
          <strong>Bitiş Zamanı:</strong> {history?.end_time ? new Date(history.end_time).toLocaleString() : '-'}
        </div>
        <div className="mb-3">
          <strong>İşlenen Kayıt Sayısı:</strong> {history?.processed_count}
        </div>
        <div className="mb-3">
          <strong>Referans Tarihi:</strong> {formatReferenceDate(history?.reference_date)}
        </div>
        <div className="mb-3">
          <strong>Çalıştırma Türü:</strong> {getExecutionTypeLabel(history?.execution_type)}
        </div>
        <div className="mb-3">
          <strong>Çalıştıran Kullanıcı:</strong> {history?.triggered_by_user_id ?? '-'}
        </div>
        {history?.execution_node && (
          <div className="mb-3">
            <strong>Çalıştığı Sunucu:</strong> {history.execution_node}
          </div>
        )}
        
        {history?.error_summary && (
          <div className="mt-4">
            <h6 className="text-danger border-bottom pb-2">Hata Özeti</h6>
            <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto' }}>
              {history.error_summary}
            </pre>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Kapat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default JobHistoryModal;
