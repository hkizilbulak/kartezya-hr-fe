'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { Edit, Trash2 } from 'react-feather';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RequestType } from '@/models/hr/hr-requests';

const OtherRequestTypeManagement = () => {
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<RequestType | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    // Validasyon hataları için state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Silme Onay Modalı State'leri
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${HR_ENDPOINTS.REQUEST_TYPES}?sort=created_at&direction=DESC`);
            setTypes(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talep türleri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = "Talep türü girmek zorunludur.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleShowAdd = () => {
        setEditingType(null);
        setFormData({ name: '', description: '' });
        setErrors({});
        setShowModal(true);
    };

    const handleShowEdit = (type: RequestType) => {
        setEditingType(type);
        setFormData({ name: type.name, description: type.description });
        setErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

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

    const askForDeleteConfirm = (id: number) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        try {
            setShowDeleteModal(false);
            setLoading(true);
            await axiosInstance.delete(`${HR_ENDPOINTS.REQUEST_TYPES}/${deleteTargetId}`);
            toast.success('Talep türü silindi.');
            fetchTypes();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Silinemedi.');
        } finally {
            setLoading(false);
            setDeleteTargetId(null);
        }
    };

    return (
        <>
            <LoadingOverlay show={loading} />

            <PageHeading
                heading="Talep Türleri"
                showCreateButton={true}
                createButtonText="Yeni Talep Türü"
                onCreate={handleShowAdd}
                showFilterButton={false}
            />

            <div className="content-wrapper">
                <Card className="border-0 shadow-sm position-relative">
                    <Card.Body className="p-0">
                        <div className="table-box">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Talep Türü</th>
                                            <th>Açıklama</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {types.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-4">Talep türü bulunamadı</td>
                                            </tr>
                                        ) : (
                                            types.map(t => (
                                                <tr key={t.id}>
                                                    <td className="fw-medium">{t.name}</td>
                                                    <td>{t.description || '-'}</td>
                                                    <td className="text-end">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleShowEdit(t)}
                                                            title="Düzenle"
                                                        >
                                                            <Edit size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => askForDeleteConfirm(t.id)}
                                                            title="Sil"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
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
                <Form onSubmit={handleSubmit} noValidate>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingType ? 'Talep Türünü Düzenle' : 'Yeni Talep Türü Ekle'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Talep Türü <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                value={formData.name}
                                onChange={e => {
                                    setFormData({ ...formData, name: e.target.value });
                                    setErrors({ ...errors, name: '' });
                                }}
                                isInvalid={!!errors.name}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? (
                                <Spinner size="sm" animation="border" />
                            ) : (
                                editingType ? 'Güncelle' : 'Oluştur'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Silme Modalı */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5 fw-bold text-dark">Talep Türünü Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        Bu talep türünü silmek istediğinizden emin misiniz?
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Kapat</Button>
                    <Button variant="danger" onClick={handleDelete}>Sil</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default OtherRequestTypeManagement;