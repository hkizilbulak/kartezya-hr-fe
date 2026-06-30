'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { useRouter } from 'next/navigation';

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

interface OtherRequestModalProps {
    show: boolean;
    onHide: () => void;
    editing: OtherRequest | null;
    types: RequestType[];
    onSuccess: () => void;
}

const OtherRequestModal: React.FC<OtherRequestModalProps> = ({ show, onHide, editing, types, onSuccess }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({ request_type_id: 0, description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            if (editing) {
                setFormData({ request_type_id: editing.request_type_id, description: editing.description });
            } else {
                setFormData({ request_type_id: 0, description: '' });
            }
        }
    }, [show, editing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);
            if (editing) {
                const payload = { ...formData, status: 'ACTIVE' };
                await axiosInstance.put(`${HR_ENDPOINTS.OTHER_REQUESTS}/${editing.id}`, payload);
                toast.success('Talep güncellendi ve durumu Aktif\'e çekildi.');
            } else {
                await axiosInstance.post(HR_ENDPOINTS.OTHER_REQUESTS, formData);
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
        <Modal show={show} onHide={onHide} backdrop="static" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Talebi Düzenle' : 'Yeni Talep Oluştur'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Talep Türü *</Form.Label>
                        <Form.Select
                            value={formData.request_type_id}
                            onChange={(e) => setFormData({ ...formData, request_type_id: Number(e.target.value) })}
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
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Vazgeç</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default OtherRequestModal;