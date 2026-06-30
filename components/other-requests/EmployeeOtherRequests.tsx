'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Badge } from 'react-bootstrap';
import { XCircle, Edit2, Eye } from 'react-feather';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import OtherRequestModal from '@/components/modals/OtherRequestModal';
import OtherRequestDocumentModal from '@/components/modals/OtherRequestDocumentModal';
import { Attachment } from '@/models/common/attachment-models';

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
    attachments?: Attachment[];
}

const EmployeeOtherRequests = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);

    // Ayrılan Modal State'leri
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<OtherRequest | null>(null);

    // İptal Modalı State'leri
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

    // Yeni Doküman Modalı State'leri
    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        fetchData();
        fetchTypes();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/me`);
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

    const openDocs = (req: OtherRequest) => {
        setSelectedReqId(req.id);
        setAttachments(req.attachments || []);
        setShowDocModal(true);
    };

    const handleEditClick = (req: OtherRequest) => {
        if (req.status === 'COMPLETED') {
            toast.warn('Tamamlanmış talepler güncellenemez.');
            return;
        }
        setEditing(req);
        setShowModal(true);
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

    return (
        <>
            <LoadingOverlay show={loading} />

            <PageHeading
                heading="Diğer Taleplerim"
                showCreateButton={true}
                createButtonText="Yeni Talep Ekle"
                onCreate={() => { setEditing(null); setShowModal(true); }}
                showFilterButton={false}
            />

            <div className="content-wrapper">
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
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
                                {requests.map((req) => (
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
                                                <Button variant="outline-secondary" size="sm" onClick={() => openDocs(req)}>
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
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>

            <OtherRequestDocumentModal
                show={showDocModal}
                onHide={() => setShowDocModal(false)}
                reqId={selectedReqId}
                initialAttachments={attachments}
                onSuccess={fetchData}
                canDelete={false}
            />

            <OtherRequestModal
                show={showModal}
                onHide={() => setShowModal(false)}
                editing={editing}
                types={types}
                onSuccess={fetchData}
            />
            {/* İPTAL ONAY MODALI */}
            <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                size="sm"
                centered={false}
                dialogClassName="modal-top-margin"
            >
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

        </>
    );
};

export default EmployeeOtherRequests;