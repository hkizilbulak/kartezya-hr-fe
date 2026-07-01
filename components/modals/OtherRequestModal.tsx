'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { useRouter } from 'next/navigation';
import { OtherRequest, RequestType } from '@/models/hr/hr-requests';
import FormSelectField from '@/components/FormSelectField';

interface OtherRequestModalProps {
    show: boolean;
    onHide: () => void;
    editing: OtherRequest | null;
    types: RequestType[];
    onSuccess: () => void;
}

const OtherRequestModal: React.FC<OtherRequestModalProps> = ({ show, onHide, editing, types, onSuccess }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({ request_type_id: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (show) {
            setErrors({});
            if (editing) {
                setFormData({
                    request_type_id: editing.request_type_id?.toString() || '',
                    description: editing.description
                });
            } else {
                setFormData({ request_type_id: '', description: '' });
            }
        }
    }, [show, editing]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.request_type_id || Number(formData.request_type_id) <= 0) {
            newErrors.request_type_id = "Lütfen bir talep türü seçin.";
        }
        if (!formData.description.trim()) newErrors.description = "Açıklama alanı boş bırakılamaz.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;
        if (submitting) return;

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                request_type_id: Number(formData.request_type_id)
            };

            if (editing) {
                await axiosInstance.put(`${HR_ENDPOINTS.OTHER_REQUESTS}/${editing.id}`, { ...payload, status: 'ACTIVE' });
                toast.success('Talep güncellendi.');
            } else {
                await axiosInstance.post(HR_ENDPOINTS.OTHER_REQUESTS, payload);
                toast.success('Talep oluşturuldu.');
            }

            onSuccess();
            onHide();
            router.refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered enforceFocus={false}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Talebi Düzenle' : 'Yeni Talep Ekle'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Talep Türü <span className="text-danger">*</span></Form.Label>
                        <FormSelectField
                            name="request_type_id"
                            value={formData.request_type_id}
                            onChange={(e: any) => {
                                setFormData({ ...formData, request_type_id: e.target.value });
                                setErrors({ ...errors, request_type_id: '' });
                            }}
                            isInvalid={!!errors.request_type_id}
                        >
                            <option value="">Seçiniz...</option>
                            {[...types]
                                .sort((a, b) => (b.id || 0) - (a.id || 0))
                                .map((t) => (
                                    <option key={t.id} value={t.id.toString()}>{t.name}</option>
                                ))}
                        </FormSelectField>

                        {errors.request_type_id && (
                            <div className="invalid-feedback d-block">
                                {errors.request_type_id}
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Açıklama <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea" rows={4}
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                setErrors({ ...errors, description: '' });
                            }}
                            isInvalid={!!errors.description}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.description}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>İptal</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? <Spinner size="sm" animation="border" /> : 'Talep Oluştur'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default OtherRequestModal;