import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Event, ParticipantStatus } from '@/models/hr/hr-models';
import { eventService } from '@/services';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import LoadingOverlay from '@/components/LoadingOverlay';

interface ParticipateModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  event: Event | null;
}

const ParticipateModal: React.FC<ParticipateModalProps> = ({ show, onHide, onSave, event }) => {
  const [status, setStatus] = useState<ParticipantStatus>(ParticipantStatus.ATTENDING);
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && event) {
      // Find current user's participation if it exists? We don't have user id here easily without useAuth.
      // Assuming event.participants is populated with current user's entry from API due to active dashboard fetch logic.
      if (event.participants && event.participants.length > 0) {
        setStatus(event.participants[0].status);
        setCompanionCount(event.participants[0].companion_count);
      } else {
        setStatus(ParticipantStatus.ATTENDING);
        setCompanionCount(0);
      }
    }
  }, [show, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    try {
      await eventService.participate(event.id, {
        status,
        companion_count: companionCount
      });
      toast.success('Katılım durumunuz güncellendi');
      onSave();
      onHide();
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message || 'Bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <div className="position-relative">
        <LoadingOverlay show={loading} message="Kaydediliyor..." />
        <Modal.Header closeButton>
          <Modal.Title>Etkinlik Katılımı</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <h5 className="mb-3">{event.name}</h5>
            <Form.Group className="mb-3">
              <Form.Label>Katılım Durumunuz</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="attending"
                  name="status"
                  label="Katılacağım"
                  checked={status === ParticipantStatus.ATTENDING}
                  onChange={() => setStatus(ParticipantStatus.ATTENDING)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="not_attending"
                  name="status"
                  label="Katılamayacağım"
                  checked={status === ParticipantStatus.NOT_ATTENDING}
                  onChange={() => setStatus(ParticipantStatus.NOT_ATTENDING)}
                />
              </div>
            </Form.Group>

            {status === ParticipantStatus.ATTENDING && event.allow_companion && (
              <Form.Group className="mb-3">
                <Form.Label>Refakatçi Sayısı (Max: {event.max_companion})</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max={event.max_companion}
                  value={companionCount}
                  onChange={(e) => setCompanionCount(parseInt(e.target.value) || 0)}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>Kaydet</Button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
};

export default ParticipateModal;
