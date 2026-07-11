'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Row, Col, Form } from 'react-bootstrap';
import { MessageCircle, FileText, Check, XCircle, X, ChevronUp, ChevronDown } from 'react-feather';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import OtherRequestDocumentModal from '@/components/modals/OtherRequestDocumentModal';
import FormDateField from '@/components/FormDateField';
import FormSelectField from '@/components/FormSelectField';
import { Attachment } from '@/models/common/attachment-models';
import { OtherRequest, RequestType } from '@/models/hr/hr-requests';

const AdminOtherRequests = () => {
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [types, setTypes] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);

    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetReq, setCancelTargetReq] = useState<OtherRequest | null>(null);

    // Filtre State'leri
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterTypeId, setFilterTypeId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    }>({
        key: 'created_at',
        direction: 'desc'
    });

    useEffect(() => {
        fetchRequests();
        fetchTypes();
    }, []);

    const fetchRequests = async (sortKey: string = sortConfig.key, sortDir: 'asc' | 'desc' = sortConfig.direction) => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}?limit=9999&sort=${sortKey}&direction=${sortDir.toUpperCase()}`);
            setRequests(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talepler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        fetchRequests(key, direction);
    };

    const getSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? 
            <ChevronUp size={16} className="ms-1" style={{ display: 'inline' }} /> : 
            <ChevronDown size={16} className="ms-1" style={{ display: 'inline' }} />;
    };

    const fetchTypes = async () => {
        try {
            const res = await axiosInstance.get(HR_ENDPOINTS.REQUEST_TYPES);
            const fetchedTypes = res.data.data || [];
            // Sıralama
            const sortedTypes = [...fetchedTypes].sort((a, b) => (b.id || 0) - (a.id || 0));
            setTypes(sortedTypes);
        } catch (error) {
            console.error('Talep türleri yüklenemedi', error);
        }
    };

    // --- FRONTEND FİLTRELEME ---
    const filteredRequests = requests.filter((req) => {
        let isMatch = true;
        if (filterStatus && req.status !== filterStatus) isMatch = false;
        if (filterTypeId && req.request_type_id?.toString() !== filterTypeId) isMatch = false;
        if (filterStartDate && dayjs(req.created_at).isBefore(dayjs(filterStartDate), 'day')) isMatch = false;
        if (filterEndDate && dayjs(req.created_at).isAfter(dayjs(filterEndDate), 'day')) isMatch = false;
        return isMatch;
    });

    const askForCompletionConfirm = (id: number) => {
        setConfirmTargetId(id);
        setShowConfirmModal(true);
    };

    const handleComplete = async () => {
        if (!confirmTargetId) return;
        try {
            setShowConfirmModal(false);
            setLoading(true);
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${confirmTargetId}/complete`);
            toast.success('Başarıyla tamamlandı.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setLoading(false);
            setConfirmTargetId(null);
        }
    };

    const askForCancelConfirm = (req: OtherRequest) => {
        setCancelTargetReq(req);
        setShowCancelModal(true);
    };

    const handleCancel = async () => {
        if (!cancelTargetReq) return;
        try {
            setShowCancelModal(false);
            setLoading(true);
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${cancelTargetReq.id}/cancel`);
            toast.success('Talep başarıyla iptal edildi.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setLoading(false);
            setCancelTargetReq(null);
        }
    };

    const openWhatsApp = (phone: string) => {
        if (!phone) { toast.warning('Kayıtlı cep telefonu bulunamadı.'); return; }
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const openDocs = (req: OtherRequest) => {
        setSelectedReqId(req.id);
        setSelectedAttachments(req.attachments || []);
        setShowDocModal(true);
    };

    const getStatusBadge = (status: string) => {
        if (status === 'COMPLETED') return <Badge bg="success">Tamamlandı</Badge>;
        if (status === 'CANCELLED') return <Badge bg="danger">İptal Edildi</Badge>;
        return <Badge bg="warning">Beklemede</Badge>;
    };

    return (
        <>
            <LoadingOverlay show={loading} />
            <PageHeading heading="Diğer Talepler" showCreateButton={false} showFilterButton={false} />

            <div className="content-wrapper">
                <Card className="border-0 shadow-sm mb-3">
                    <Card.Body className="py-2 px-3">
                        <Row className="g-2 align-items-end">
                            <Col md={3}>
                                <Form.Group>
                                    <FormSelectField label="Talep Durumu" name="filterStatus" value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
                                        <option value="">Tümü</option>
                                        <option value="ACTIVE">Beklemede</option>
                                        <option value="COMPLETED">Tamamlandı</option>
                                        <option value="CANCELLED">İptal Edildi</option>
                                    </FormSelectField>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <FormSelectField label="Talep Türü" name="filterTypeId" value={filterTypeId} onChange={(e: any) => setFilterTypeId(e.target.value)}>
                                        <option value="">Tümü</option>
                                        {types.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
                                    </FormSelectField>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <FormDateField label="Başlangıç Tarihi" name="filterStartDate" value={filterStartDate} onChange={(e: any) => setFilterStartDate(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <FormDateField label="Bitiş Tarihi" name="filterEndDate" value={filterEndDate} onChange={(e: any) => setFilterEndDate(e.target.value)} />
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
                                            <th onClick={() => handleSort('employee_id')} className="sortable-header" style={{cursor: 'pointer'}}>
                                                Çalışan Adı Soyadı {getSortIcon('employee_id')}
                                            </th>
                                            <th onClick={() => handleSort('request_type_id')} className="sortable-header" style={{cursor: 'pointer'}}>
                                                Talep Türü {getSortIcon('request_type_id')}
                                            </th>
                                            <th onClick={() => handleSort('description')} className="sortable-header" style={{cursor: 'pointer'}}>
                                                Talep Açıklaması {getSortIcon('description')}
                                            </th>
                                            <th onClick={() => handleSort('created_at')} className="sortable-header" style={{cursor: 'pointer'}}>
                                                Oluşturma Tarihi {getSortIcon('created_at')}
                                            </th>
                                            <th>Talep Durumu</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">Talep bulunamadı</td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map(req => (
                                                <tr key={req.id}>
                                                    <td>{req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : '-'}</td>
                                                    <td>{req.request_type?.name || '-'}</td>
                                                    <td>{req.description}</td>
                                                    <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                                    <td>{getStatusBadge(req.status)}</td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button variant="outline-secondary" size="sm" onClick={() => openDocs(req)}><FileText size={14} /></Button>
                                                            <Button variant="outline-success" size="sm" onClick={() => openWhatsApp(req.employee?.phone || '')} disabled={!req.employee?.phone}><MessageCircle size={14} /></Button>
                                                            {req.status === 'ACTIVE' && <Button variant="outline-success" size="sm" onClick={() => askForCompletionConfirm(req.id)}><Check size={14} /></Button>}
                                                            {req.status !== 'CANCELLED' && <Button variant="outline-danger" size="sm" onClick={() => askForCancelConfirm(req)}><X size={14} /></Button>}
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

            <OtherRequestDocumentModal show={showDocModal} onHide={() => setShowDocModal(false)} reqId={selectedReqId} initialAttachments={selectedAttachments} onSuccess={fetchRequests} />

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="h5 fw-bold text-dark">Talebi Tamamla</Modal.Title></Modal.Header>
                <Modal.Body className="pt-2 pb-3"><p className="text-muted mb-0" style={{ fontSize: '14px' }}>Bu talebi tamamlandı olarak işaretlemek istediğinizden emin misiniz?</p></Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Kapat</Button>
                    <Button variant="success" onClick={handleComplete}>Tamamla</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="h5 fw-bold text-dark">Talebi İptal Et</Modal.Title></Modal.Header>
                <Modal.Body className="pt-2 pb-3"><p className="text-muted mb-0" style={{ fontSize: '14px' }}>Bu talebi iptal etmek istediğinizden emin misiniz?</p></Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Kapat</Button>
                    <Button variant="danger" onClick={handleCancel}>İptal Et</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AdminOtherRequests;