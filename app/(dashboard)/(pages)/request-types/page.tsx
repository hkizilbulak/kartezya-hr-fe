'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { Plus, Edit, Trash2 } from 'react-feather';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';

interface RequestType {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

export default function RequestTypesPage() {
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<RequestType | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(HR_ENDPOINTS.REQUEST_TYPES);
            setTypes(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talep türleri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleShowAdd = () => {
        setEditingType(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleShowEdit = (type: RequestType) => {
        setEditingType(type);
        setFormData({ name: type.name, description: type.description });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingType) {
                await axiosInstance.put(`${HR_ENDPOINTS.REQUEST_TYPES}/${editingType.id}`, formData);
                toast.success('Talep türü güncellendi.');
            } else {
                await axiosInstance.post(HR_ENDPOINTS.REQUEST_TYPES, formData);
                toast.success('Talep türü oluşturuldu.');
            }
            setShowModal(false);
            fetchTypes();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız oldu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu talep türünü silmek istediğinize emin misiniz?')) return;
        try {
            await axiosInstance.delete(`${HR_ENDPOINTS.REQUEST_TYPES}/${id}`);
            toast.success('Talep türü silindi.');
            fetchTypes();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Silinemedi.');
        }
    };

    return (
        <div className="page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Talep Türleri Yönetimi</h4>
                <Button variant="primary" onClick={handleShowAdd} className="d-flex align-items-center gap-2">
                    <Plus size={18} /> Yeni Ekle
                </Button>
            </div>

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Talep Tipi Adı</th>
                                    <th>Açıklama</th>
                                    <th className="text-end">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {types.map(t => (
                                    <tr key={t.id}>
                                        <td className="fw-medium">{t.name}</td>
                                        <td>{t.description || '-'}</td>
                                        <td className="text-end">
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEdit(t)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingType ? 'Talep Türünü Düzenle' : 'Yeni Talep Türü Ekle'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Talep Tipi Adı *</Form.Label>
                            <Form.Control 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control 
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}