'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Badge, Form } from 'react-bootstrap';
import { XCircle, Edit2, Eye, X, FileText, Edit } from 'react-feather';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import OtherRequestModal from '@/components/modals/OtherRequestModal';
import OtherRequestDocumentModal from '@/components/modals/OtherRequestDocumentModal';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import { Attachment } from '@/models/common/attachment-models';
import { OtherRequest, RequestType } from '@/models/hr/hr-requests';

const EmployeeOtherRequests = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<OtherRequest | null>(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Filtre State'leri
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterTypeId, setFilterTypeId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    useEffect(() => {
        fetchData();
        fetchTypes();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/me?sort=created_at&direction=DESC`);
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
            const fetchedTypes = res.data.data || [];
            const sortedTypes = [...fetchedTypes].sort((a, b) => (b.id || 0) - (a.id || 0));
            setTypes(sortedTypes);
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

    // --- FRONTEND FİLTRELEME ---
    const filteredRequests = requests.filter((req) => {
        let isMatch = true;

        if (filterStatus && req.status !== filterStatus) {
            isMatch = false;
        }

        if (filterTypeId) {
            const typeId = req.request_type_id || req.request_type?.id;
            if (typeId?.toString() !== filterTypeId) {
                isMatch = false;
            }
        }

        if (filterStartDate) {
            if (dayjs(req.created_at).isBefore(dayjs(filterStartDate), 'day')) {
                isMatch = false;
            }
        }

        if (filterEndDate) {
            if (dayjs(req.created_at).isAfter(dayjs(filterEndDate), 'day')) {
                isMatch = false;
            }
        }

        return isMatch;
    });

    return (
        <>
            <LoadingOverlay show={loading} />

            <div className="employee-other-requests">
                <div className="page-heading-wrapper">
                    <PageHeading
                        heading="Diğer Taleplerim"
                        showCreateButton={true}
                        createButtonText="Yeni Talep Ekle"
                        onCreate={() => { setEditing(null); setShowModal(true); }}
                        showFilterButton={false}
                    />
                </div>

                <Row className="g-3">
                    <Col lg={12} md={12} sm={12} className="content-wrapper">
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0" style={{ fontWeight: 700, fontSize: '16px' }}>Tüm Taleplerim</h6>
                            </div>

                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Body className="py-2 px-3">
                                    <Row className="g-2 align-items-end">
                                        <Col md={3}>
                                            <Form.Group>
                                                <FormSelectField
                                                    label="Talep Durumu"
                                                    name="filterStatus"
                                                    value={filterStatus}
                                                    onChange={(e: any) => setFilterStatus(e.target.value)}
                                                >
                                                    <option value="">Tümü</option>
                                                    <option value="ACTIVE">Beklemede</option>
                                                    <option value="COMPLETED">Tamamlandı</option>
                                                    <option value="CANCELLED">İptal Edildi</option>
                                                </FormSelectField>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <FormSelectField
                                                    label="Talep Türü"
                                                    name="filterTypeId"
                                                    value={filterTypeId}
                                                    onChange={(e: any) => setFilterTypeId(e.target.value)}
                                                >
                                                    <option value="">Tümü</option>
                                                    {types.map(t => (
                                                        <option key={t.id} value={t.id.toString()}>{t.name}</option>
                                                    ))}
                                                </FormSelectField>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <FormDateField
                                                    label="Başlangıç Tarihi"
                                                    name="filterStartDate"
                                                    value={filterStartDate}
                                                    onChange={(e: any) => setFilterStartDate(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <FormDateField
                                                    label="Bitiş Tarihi"
                                                    name="filterEndDate"
                                                    value={filterEndDate}
                                                    onChange={(e: any) => setFilterEndDate(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

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
                                                    {filteredRequests.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-4">
                                                                Talep bulunamadı
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredRequests.map((req) => (
                                                            <tr key={req.id}>
                                                                <td className="fw-medium">{req.request_type?.name || 'Bilinmiyor'}</td>
                                                                <td>{req.description}</td>
                                                                <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                                                <td>
                                                                    {req.status === 'ACTIVE' && <Badge bg="warning">Beklemede</Badge>}
                                                                    {req.status === 'COMPLETED' && <Badge bg="success">Tamamlandı</Badge>}
                                                                    {req.status === 'CANCELLED' && <Badge bg="danger">İptal Edildi</Badge>}
                                                                </td>
                                                                <td className="text-end">
                                                                    <div className="d-flex justify-content-end gap-2">
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            size="sm"
                                                                            title="Dökümanlar"
                                                                            onClick={() => openDocs(req)}
                                                                        >
                                                                            <FileText size={16} />
                                                                        </Button>
                                                                        {req.status !== 'COMPLETED' && (
                                                                            <Button
                                                                                variant="outline-primary"
                                                                                size="sm"
                                                                                title="Düzenle"
                                                                                onClick={() => handleEditClick(req)}
                                                                            >
                                                                                <Edit size={14} />
                                                                            </Button>
                                                                        )}

                                                                        {/* İptal Etme */}
                                                                        {req.status === 'ACTIVE' && (
                                                                            <Button
                                                                                variant="outline-danger"
                                                                                size="sm"
                                                                                title="İptal Et"
                                                                                onClick={() => askForCancelConfirm(req.id)}
                                                                            >
                                                                                <X size={14} />
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
                    </Col>
                </Row>
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

            <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                size="sm"
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