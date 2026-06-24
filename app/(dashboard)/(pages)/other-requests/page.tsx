'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { Plus, XCircle, Edit2 } from 'react-feather';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';

interface RequestType {
    id: number;
    name: string;
    description: string;
}

interface OtherRequest {
    id: number;
    description: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    request_type_id: number;
    request_type?: RequestType;
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

    const handleCancel = async (id: number) => {
        if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
        try {
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${id}/cancel`);
            toast.success('Talep iptal edildi.');
            await fetchData();
            router.refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        }
    };

    return (
        <div className="page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Diğer Taleplerim</h4>
                <Button variant="primary" onClick={handleAddClick} className="d-flex align-items-center gap-2">
                    <Plus size={18} /> Yeni Talep Ekle
                </Button>
            </div>

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : requests.length === 0 ? (
                        <div className="text-center p-5 text-muted">Henüz talebiniz yok.</div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
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
                                {requests.map((req) => (
                                    <tr key={req.id}>
                                        <td className="fw-medium">{req.request_type?.name || 'Bilinmiyor'}</td>
                                        <td style={{ maxWidth: '250px' }} className="text-truncate">{req.description}</td>
                                        <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                        <td>
                                            {req.status === 'ACTIVE' && <Badge bg="warning" className="text-white">Aktif</Badge>}
                                            {req.status === 'COMPLETED' && <Badge bg="success" className="text-white">Tamamlandı</Badge>}
                                            {req.status === 'CANCELLED' && <Badge bg="danger" className="text-white">İptal Edildi</Badge>}
                                        </td>
                                        <td className="text-end">
                                            {req.status !== 'COMPLETED' && (
                                                <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditClick(req)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                            )}
                                            {req.status === 'ACTIVE' && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleCancel(req.id)}>
                                                    <XCircle size={16} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
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
        </div>
    );
}