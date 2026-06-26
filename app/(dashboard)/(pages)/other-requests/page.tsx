'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Spinner, Container } from 'react-bootstrap';
import { Plus, XCircle, Edit2, Eye } from 'react-feather';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

interface RequestType {
    id: number;
    name: string;
    description: string;
}

interface Attachment { id: string; file_name: string; }

interface OtherRequest {
    id: number;
    description: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    request_type_id: number;
    request_type?: RequestType;
    attachments?: Attachment[];
}

export default function OtherRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<OtherRequest | null>(null);
    const [formData, setFormData] = useState({ request_type_id: 0, description: '' });
    const [submitting, setSubmitting] = useState(false);

    // İptal Modalı State'leri
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

    const [showDocModal, setShowDocModal] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            fetchData();
            fetchTypes();
        }
        return () => { isMounted = false; };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(HR_ENDPOINTS.OTHER_REQUESTS);
            setRequests(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talepler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        try {
            const res = await axiosInstance.get(HR_ENDPOINTS.REQUEST_TYPES);
            setTypes(res.data.data || []);
        } catch (error) {
            console.error('Talep türleri yüklenemedi', error);
        }
    };

    const handleAddClick = () => {
        setEditing(null);
        setFormData({ request_type_id: 0, description: '' });
        setShowModal(true);
    };

    const handleEditClick = (req: OtherRequest) => {
        if (req.status === 'COMPLETED') {
            toast.warn('Tamamlanmış talepler güncellenemez.');
            return;
        }
        setEditing(req);
        setFormData({ request_type_id: req.request_type_id, description: req.description });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);
            if (editing) {
                await axiosInstance.put(`${HR_ENDPOINTS.OTHER_REQUESTS}/${editing.id}`, formData);
                toast.success('Talep güncellendi ve durumu Aktif\'e çekildi.');
            } else {
                await axiosInstance.post(HR_ENDPOINTS.OTHER_REQUESTS, formData);
                toast.success('Talep oluşturuldu.');
            }
            setShowModal(false);
            await fetchData();
            router.refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setSubmitting(false);
        }
    };

    const askForCancelConfirm = (id: number) => {
        setCancelTargetId(id);
        setShowCancelModal(true);
    };

    const handleCancel = async () => {
        if (!cancelTargetId) return;
        try {
            setShowCancelModal(false);
            setLoading(true);
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${cancelTargetId}/cancel`);
            toast.success('Talep iptal edildi.');
            await fetchData();
            router.refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setLoading(false);
            setCancelTargetId(null);
        }
    };

    const openDocs = (req: OtherRequest) => {
        setAttachments(req.attachments || []);
        setShowDocModal(true);
    };

    const handleDownloadDoc = async (docId: string, fileName: string) => {
        try {
            const response = await axiosInstance.get(`/documents/${docId}/download`, {
                responseType: 'blob'
            });
            const fileBlob = new Blob([response.data], { type: response.data.type });
            const url = window.URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Dosya indirilirken bir hata oluştu.');
        }
    };

    return (
        <Container fluid className="page-container">
            <LoadingOverlay show={loading} />
            
            <PageHeading 
                heading="Diğer Taleplerim"
                showCreateButton={false}
                showFilterButton={false}
            />

            <div className="content-wrapper">
                <div className="content-header d-flex flex-column align-items-start gap-2 mb-3">
                    <Button variant="primary" onClick={handleAddClick} className="d-flex align-items-center gap-2">
                        <Plus size={18} /> Yeni Talep Ekle
                    </Button>
                </div>

                <Card className="border-0 shadow-sm position-relative">
                    <Card.Body className="p-0">
                        <div className="table-box">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Talep Türü</th>
                                            <th>Açıklama</th>
                                            <th>Tarih</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4">
                                                    Henüz talebiniz yok.
                                                </td>
                                            </tr>
                                        ) : (
                                            requests.map((req) => (
                                                <tr key={req.id}>
                                                    <td className="fw-medium">{req.request_type?.name || 'Bilinmiyor'}</td>
                                                    <td>{req.description}</td>
                                                    <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                                    <td>
                                                        {req.status === 'ACTIVE' && <Badge bg="warning">Bekliyor</Badge>}
                                                        {req.status === 'COMPLETED' && <Badge bg="success">Tamamlandı</Badge>}
                                                        {req.status === 'CANCELLED' && <Badge bg="danger">İptal Edildi</Badge>}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button 
                                                                variant="outline-secondary" 
                                                                size="sm"
                                                                title="Belgeleri Görüntüle"
                                                                onClick={() => openDocs(req)}
                                                            >
                                                                <Eye size={14} />
                                                            </Button>
                                                            {req.status !== 'COMPLETED' && (
                                                                <Button variant="outline-secondary" size="sm" onClick={() => handleEditClick(req)}>
                                                                    <Edit2 size={14} />
                                                                </Button>
                                                            )}
                                                            {req.status === 'ACTIVE' && (
                                                                <Button variant="outline-danger" size="sm" onClick={() => askForCancelConfirm(req.id)}>
                                                                    <XCircle size={14} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editing ? 'Talebi Düzenle' : 'Yeni Talep Oluştur'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Talep Türü *</Form.Label>
                            <Form.Select 
                                value={formData.request_type_id}
                                onChange={(e) => setFormData({...formData, request_type_id: Number(e.target.value)})}
                                required
                            >
                                <option value={0}>Seçiniz...</option>
                                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama *</Form.Label>
                            <Form.Control 
                                as="textarea" rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Vazgeç</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* İptal Onay */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5 fw-bold text-dark">Talebi İptal Et</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        Bu talebi iptal etmek istediğinizden emin misiniz?
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" className="px-3 bg-secondary border-0" onClick={() => setShowCancelModal(false)}>
                        Kapat
                    </Button>
                    <Button variant="danger" className="px-3 border-0" onClick={handleCancel}>
                        İptal Et
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Doküman Görüntüleme Modalı */}
            <Modal show={showDocModal} onHide={() => setShowDocModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Talep Doküman Görüntüleme</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-2">
                        <h6>Yüklü Belgeler:</h6>
                        {attachments.length === 0 ? (
                            <p className="text-muted small">Bu talebe ait yüklü belge bulunmuyor.</p>
                        ) : (
                            <ul className="list-group mb-2">
                                {attachments.map(doc => (
                                    <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span 
                                            onClick={() => handleDownloadDoc(doc.id, doc.file_name)}
                                            className="small text-truncate text-primary fw-medium"
                                            style={{ maxWidth: '350px', cursor: 'pointer', textDecoration: 'underline' }}
                                            title="Dosyayı İndir"
                                        >
                                            {doc.file_name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDocModal(false)}>Kapat</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}