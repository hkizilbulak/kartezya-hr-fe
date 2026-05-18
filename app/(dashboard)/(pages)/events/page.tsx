"use client";
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container, Badge, Modal } from 'react-bootstrap';
import { eventService } from '@/services';
import { Event, EventStatus } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import EventModal from '@/components/modals/EventModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, Edit, Trash2, Send, Download } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';
import moment from 'moment';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishEvent, setPublishEvent] = useState<Event | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchEvents = async (page: number = 1, perPage?: number) => {
    try {
      setIsLoading(true);
      
      const response = await eventService.getAll({ 
        page, 
        limit: perPage || itemsPerPage,
        sort: "start_date",
        direction: "DESC"
      });
      
      if (response.data) {
        setEvents(response.data);
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || 0);
        setCurrentPage(page);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Veri çekme sırasında hata oluştu';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, []);

  const handleAddNew = () => {
    setSelectedEvent(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      setDeleteLoading(true);
      try {
        await eventService.delete(selectedEvent.id);
        toast.success('Etkinlik başarıyla silindi');
        fetchEvents(currentPage);
        setShowDeleteModal(false);
        setSelectedEvent(null);
      } catch (error: any) {
        toast.error(translateErrorMessage(error.message));
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handlePublishClick = (event: Event) => {
    setPublishEvent(event);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async () => {
    if (!publishEvent) return;
    try {
      setIsLoading(true);
      await eventService.publish(publishEvent.id);
      toast.success('Etkinlik yayınlandı ve e-postalar gönderildi');
      fetchEvents(currentPage);
      setShowPublishModal(false);
      setPublishEvent(null);
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message || 'Yayınlama sırasında hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (event: Event) => {
    try {
      setIsLoading(true);
      const blob = await eventService.exportParticipants(event.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `katilimcilar_${event.name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(translateErrorMessage(error.message || 'Dışa aktarma sırasında hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSave = () => {
    fetchEvents(currentPage);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setIsEdit(false);
  };

  return (
    <>
      <Container fluid className="page-container">
        <LoadingOverlay show={isLoading} message="Yükleniyor..." />

        <div className="page-heading-wrapper">
          <PageHeading 
            heading="Etkinlikler"
            showCreateButton={true}
            showFilterButton={false}
            createButtonText="Yeni Etkinlik"
            onCreate={handleAddNew}
          />
        </div>

        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="table-wrapper">
              <Card className="border-0 shadow-sm position-relative">                
                <Card.Body className="p-0">
                  <div className="table-box">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Etkinlik Adı</th>
                            <th>Tarih</th>
                            <th>Lokasyon</th>
                            <th>Kitle</th>
                            <th>Durum</th>
                            <th className="text-end">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.length ? (
                            events.map((event: Event) => (
                              <tr key={event.id}>
                                <td>{event.name}</td>
                                <td>{moment(event.start_date).format('DD.MM.YYYY HH:mm')}</td>
                                <td>{event.location || '-'}</td>
                                <td>{event.audience_filter === 'TARGETED' ? 'Özel Davetliler' : 'Tüm Şirket'}</td>
                                <td>
                                  {event.status === EventStatus.PUBLISHED ? (
                                    <Badge bg="success">Yayınlandı</Badge>
                                  ) : event.status === EventStatus.DRAFT ? (
                                    <Badge bg="secondary">Taslak</Badge>
                                  ) : (
                                    <Badge bg="danger">İptal</Badge>
                                  )}
                                </td>
                                <td className="text-end">
                                  {event.status === EventStatus.DRAFT && (
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      className="me-2"
                                      title="Yayınla ve Bildir"
                                      onClick={() => handlePublishClick(event)}
                                    >
                                      <Send size={14} />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    title="Katılımcı Listesi (XLSX)"
                                    onClick={() => handleExport(event)}
                                  >
                                    <Download size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEdit(event)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(event)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            !isLoading && (
                              <tr>
                                <td colSpan={6} className="text-center py-4">
                                  Kayıt bulunamadı
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {!isLoading && totalItems > 0 && (
          <Row className="mt-4">
            <Col lg={12} md={12} sm={12}>
              <div className="px-3">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => fetchEvents(p)}
                  onPageSizeChange={(p) => { setItemsPerPage(p); fetchEvents(1, p); }}
                />
              </div>
            </Col>
          </Row>
        )}

        <EventModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleModalSave}
          event={selectedEvent}
          isEdit={isEdit}
        />

        {showDeleteModal && (
          <DeleteModal
            onClose={() => setShowDeleteModal(false)}
            onHandleDelete={handleDelete}
            loading={deleteLoading}
          />
        )}

        <Modal show={showPublishModal} onHide={() => setShowPublishModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Etkinliği Yayınla</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>'{publishEvent?.name}'</strong> adlı etkinliği yayınlamak ve mail göndermek istediğinize emin misiniz?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowPublishModal(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button 
              variant="success" 
              onClick={handlePublishConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'İşleniyor...' : 'Onayla'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default EventsPage;
