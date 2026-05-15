import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { eventService } from '@/services';
import { Event, ParticipantStatus } from '@/models/hr/hr-models';
import { toast } from 'react-toastify';
import moment from 'moment';
import ParticipateModal from '../modals/ParticipateModal';

const EventsWidget = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getDashboardEvents();
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleParticipate = (event: Event) => {
    // Check deadline
    if (event.last_change_date) {
      const deadline = moment(event.last_change_date);
      if (moment().isAfter(deadline)) {
        toast.error('Bu etkinlik için katılım durumu değiştirme süresi dolmuştur.');
        return;
      }
    }
    setSelectedEvent(event);
    setShowModal(true);
  };

  const onSave = () => {
    fetchEvents();
  };

  if (loading && events.length === 0) {
    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Etkinlikler yükleniyor...</p>
        </Card.Body>
      </Card>
    );
  }

  if (events.length === 0) {
    return null; // Don't show anything if there are no active events
  }

  return (
    <>
      <div className="mb-4">
        <h6 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '1rem', fontFamily: 'Poppins, sans-serif' }}>
          Aktif Etkinlikler
        </h6>
        <Row>
          {events.map(event => {
            const participant = event.participants?.[0];
            const isAttending = participant?.status === ParticipantStatus.ATTENDING;
            const hasResponded = participant && participant.status !== ParticipantStatus.PENDING;

            return (
              <Col lg={4} md={6} xs={12} className="mb-4" key={event.id}>
                <Card className="border-0 shadow-sm h-100 position-relative overflow-hidden" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
                  {hasResponded && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1 }}>
                      {isAttending ? (
                        <Badge bg="success"><i className="fe fe-check me-1"></i> Katılıyorsun</Badge>
                      ) : (
                        <Badge bg="secondary"><i className="fe fe-x me-1"></i> Katılmıyorsun</Badge>
                      )}
                    </div>
                  )}
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-shape icon-md bg-light-primary text-primary rounded-2 me-3">
                        <i className="fe fe-calendar fs-4"></i>
                      </div>
                      <div>
                        <h5 className="mb-0">{event.name}</h5>
                        <span className="text-muted small">{event.type}</span>
                      </div>
                    </div>
                    <p className="mb-3 text-muted" style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.description || 'Detay bulunmuyor.'}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
                      <span><i className="fe fe-clock me-1"></i> {moment(event.start_date).format('DD.MM.YYYY HH:mm')}</span>
                      <span><i className="fe fe-map-pin me-1"></i> {event.location || 'Belirtilmedi'}</span>
                    </div>
                    <Button 
                      variant={hasResponded ? "outline-primary" : "primary"} 
                      className="w-100" 
                      onClick={() => handleParticipate(event)}
                    >
                      {hasResponded ? 'Durumu Güncelle' : 'Katılım Bildir'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      <ParticipateModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={onSave}
        event={selectedEvent}
      />
    </>
  );
};

export default EventsWidget;
