"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { faqService } from '@/services/faq.service';
import { FAQ } from '@/models/hr/hr-models';
import { toast } from 'react-toastify';
import { translateErrorMessage } from '@/helpers/ErrorUtils';

interface FaqModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  faq: FAQ | null;
  isEdit: boolean;
}

const FaqModal = ({ show, onHide, onSave, faq, isEdit }: FaqModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [loading, setLoading] = useState(false);

  // Modal açıldığında veya faq değiştiğinde form verilerini ayarla
  useEffect(() => {
    if (show) {
      if (isEdit && faq) {
        setFormData({
          title: faq.title,
          description: faq.description,
          status: faq.status
        });
      } else {
        setFormData({ title: '', description: '', status: 'ACTIVE' });
      }
    }
  }, [faq, isEdit, show]);

  const handleSubmit = async () => {
    // Zorunlu alan kontrolü
    if (!formData.title || !formData.description) {
      toast.warning('Lütfen başlık ve açıklama alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && faq) {
        await faqService.update(faq.id, formData);
        toast.success('SSS başarıyla güncellendi.');
      } else {
        await faqService.create(formData);
        toast.success('Yeni SSS başarıyla eklendi.');
      }
      onSave(); // Listeyi yenilemek için
      onHide(); // Modalı kapatmak için
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Kayıt sırasında bir hata oluştu.';
      toast.error(translateErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'SSS Düzenle' : 'Yeni Sıkça Sorulan Soru'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Başlık <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Soru başlığını girin..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Durum</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Açıklama (Cevap) <span className="text-danger">*</span></Form.Label>
            {/* CKEditor */}
            <div className="ckeditor-wrapper">
              <CKEditor
                editor={ClassicEditor as any}
                data={formData.description}
                onChange={(event, editor: any) => {
                  const data = editor.getData();
                  setFormData({ ...formData, description: data });
                }}
              />
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          İptal
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FaqModal;