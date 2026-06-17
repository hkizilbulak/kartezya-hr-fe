"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Container, Badge } from 'react-bootstrap';
import { faqService } from '@/services/faq.service';
import { FAQ } from '@/models/hr/hr-models';
import { PageHeading } from '@/widgets';
import Pagination from '@/components/Pagination';
import FaqModal from '@/components/modals/FaqModal';
import DeleteModal from '@/components/DeleteModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Edit, Trash2 } from 'react-feather';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';
import dayjs from 'dayjs';
// @ts-ignore
import '@/styles/table-list.scss';
// @ts-ignore
import '@/styles/components/table-common.scss';

const FaqsPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sayfalama stateleri
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchFaqs = async (page: number = 1, perPage?: number) => {
    try {
      setIsLoading(true);
      const response = await faqService.getAll({
        page,
        limit: perPage || itemsPerPage,
      });

      if (response.data) {
        setFaqs(response.data);
        // Projedeki standart pagination response'una göre ayarlandı
        setTotalPages(response.page?.total_pages || 1);
        setTotalItems(response.page?.total || response.data.length);
        setCurrentPage(page);
      }
    } catch (error: any) {
      toast.error('SSS listesi yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs(1);
  }, []);

  // Modal İşlemleri
  const handleAddNew = () => {
    setSelectedFaq(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setSelectedFaq(faq);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteClick = (faq: FAQ) => {
    setSelectedFaq(faq);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedFaq) {
      setDeleteLoading(true);
      try {
        await faqService.delete(selectedFaq.id);
        toast.success('SSS başarıyla silindi.');
        fetchFaqs(currentPage);
        setShowDeleteModal(false);
        setSelectedFaq(null);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Silme işlemi başarısız.';
        toast.error(translateErrorMessage(errorMessage));
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  return (
    <Container fluid className="page-container">
      <LoadingOverlay show={isLoading} message="SSS kayıtları yükleniyor..." />

      <div className="page-heading-wrapper">
        <PageHeading
          heading="Sıkça Sorulan Sorular"
          showCreateButton={true}
          showFilterButton={false}
          createButtonText="Yeni SSS Ekle"
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
                          <th>Başlık</th>
                          <th>Durum</th>
                          <th>Oluşturulma Tarihi</th>
                          <th>Güncellenme Tarihi</th>
                          <th className="text-end">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqs.length > 0 ? (
                          faqs.map((faq) => (
                            <tr key={faq.id}>
                              <td>{faq.title}</td>
                              <td>
                                <Badge bg={faq.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                  {faq.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                                </Badge>
                              </td>
                              <td>{faq.created_at ? dayjs(faq.created_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                              <td>{faq.updated_at ? dayjs(faq.updated_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                              <td className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(faq)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(faq)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          !isLoading && (
                            <tr>
                              <td colSpan={5} className="text-center py-4">
                                Henüz bir SSS kaydı bulunmamaktadır.
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

      {/* Sayfa */}
      {!isLoading && totalItems > 0 && (
        <Row className="mt-4">
          <Col lg={12} md={12} sm={12}>
            <div className="px-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => fetchFaqs(page, itemsPerPage)}
                onPageSizeChange={(size) => {
                  setItemsPerPage(size);
                  fetchFaqs(1, size);
                }}
              />
            </div>
          </Col>
        </Row>
      )}

      {/* Kayıt / Güncelleme */}
      <FaqModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={() => fetchFaqs(currentPage)}
        faq={selectedFaq}
        isEdit={isEdit}
      />

      {/* Silme */}
      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onHandleDelete={handleDelete}
          loading={deleteLoading}
        />
      )}
    </Container>
  );
};

export default FaqsPage;