'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Spinner, Container } from 'react-bootstrap';
import { MessageCircle, FileText, Trash, Check, XCircle } from 'react-feather';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import '@/styles/table-list.scss';
import '@/styles/components/table-common.scss';

interface Employee { id: number; first_name: string; last_name: string; phone: string; }
interface Attachment { id: string; file_name: string; }
interface OtherRequest {
    id: number; description: string; status: string; created_at: string;
    employee?: Employee; request_type?: { name: string };
    attachments?: Attachment[];
    request_type_id: number;
}

export default function OtherRequestsManagementPage() {
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Doküman Modal State'leri
    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Onay Modalı State'leri
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);

    const [showDocDeleteModal, setShowDocDeleteModal] = useState(false);
    const [deleteDocTargetId, setDeleteDocTargetId] = useState<string | null>(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTargetReq, setCancelTargetReq] = useState<OtherRequest | null>(null);

    useEffect(() => { 
        fetchRequests(); 
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(HR_ENDPOINTS.OTHER_REQUESTS);
            setRequests(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talepler yüklenemedi.');
        } finally { setLoading(false); }
    };

    // Onay modalını tetikleyen fonksiyon
    const askForCompletionConfirm = (id: number) => {
        setConfirmTargetId(id);
        setShowConfirmModal(true);
    };

    // Modalda 'Tamamla' butonuna basınca çalışacak fonksiyon
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
            
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${cancelTargetReq.id}/rollback`);
            toast.success('Talep başarıyla geri alındı ve Bekliyor durumuna çekildi.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally {
            setLoading(false);
            setCancelTargetReq(null);
        }
    };

    const openWhatsApp = (phone: string) => {
        if (!phone) {
            toast.warning('Kayıtlı cep telefonu bulunamadı.');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const openDocs = (req: OtherRequest) => {
        setSelectedReqId(req.id);
        setAttachments(req.attachments || []);
        setShowDocModal(true);
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedReqId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const res = await axiosInstance.post(`${HR_ENDPOINTS.OTHER_REQUESTS}/${selectedReqId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Dosya başarıyla yüklendi.');
            
            if (res.data && res.data.success) {
                const newDoc = {
                    id: res.data.data?.id || res.data.data?.ID || String(Date.now()),
                    file_name: res.data.data?.file_name || res.data.data?.name || res.data.data?.FileName || file.name
                };
                setAttachments(prev => [...prev, newDoc]);
            }

            setFile(null);
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Dosya yüklenemedi.');
        } finally {
            setUploading(false);
        }
    };

    const askForDocDeleteConfirm = (docId: string) => {
        setDeleteDocTargetId(docId);
        setShowDocDeleteModal(true);
    };

    const handleDeleteDoc = async () => {
        if (!deleteDocTargetId) return;
        try {
            setShowDocDeleteModal(false);
            await axiosInstance.delete(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${deleteDocTargetId}`);
            toast.success('Doküman silindi.');
            setAttachments(attachments.filter(d => d.id !== deleteDocTargetId));
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Silinemedi.');
        } finally {
            setDeleteDocTargetId(null);
        }
    };

    const handleDownloadDoc = async (docId: string, fileName: string) => {
        try {
            const response = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${docId}/download`);
            const downloadUrl = response.data?.data?.url;

            if (downloadUrl) {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.target = '_blank';
                link.setAttribute('download', fileName);
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast.error('İndirme bağlantısı alınamadı.');
            }
        } catch (error) {
            toast.error('Dosya indirilirken bir hata oluştu.');
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'COMPLETED') {
            return <Badge bg="success">Tamamlandı</Badge>;
        }
        if (status === 'CANCELLED') {
            return <Badge bg="danger">İptal Edildi</Badge>;
        }
        return <Badge bg="warning">Bekliyor</Badge>;
    };

    return (
        <Container fluid className="page-container">
            <LoadingOverlay show={loading} />
            
            <PageHeading 
                heading="Personel Talepleri Yönetimi (İK)"
                showCreateButton={false}
                showFilterButton={false}
            />

            <div className="content-wrapper">
                <div className="content-header">
                </div>

                <Card className="border-0 shadow-sm position-relative">
                    <Card.Body className="p-0">
                        <div className="table-box">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Çalışan Adı Soyadı</th>
                                            <th>Talep Tipi</th>
                                            <th>Talep Açıklaması</th>
                                            <th>Oluşturma Tarihi</th>
                                            <th>Talep Durumu</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">
                                                    Talep talebi bulunamadı
                                                </td>
                                            </tr>
                                        ) : (
                                            requests.map(req => (
                                                <tr key={req.id}>
                                                    <td>
                                                        {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : '-'}
                                                    </td>
                                                    <td>{req.request_type?.name || '-'}</td>
                                                    <td>{req.description}</td>
                                                    <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                                    <td>{getStatusBadge(req.status)}</td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button 
                                                                variant="outline-secondary" 
                                                                size="sm"
                                                                title="Dökümanlar"
                                                                onClick={() => openDocs(req)}
                                                            >
                                                                <FileText size={14} />
                                                            </Button>

                                                            <Button 
                                                                variant="outline-success" 
                                                                size="sm"
                                                                onClick={() => openWhatsApp(req.employee?.phone || '')}
                                                                title="WhatsApp Mesaj Gönderme"
                                                                disabled={!req.employee?.phone}
                                                            >
                                                                <MessageCircle size={14} />
                                                            </Button>
                                                            
                                                            {req.status === 'ACTIVE' && (
                                                                <Button 
                                                                    variant="outline-success" 
                                                                    size="sm"
                                                                    onClick={() => askForCompletionConfirm(req.id)}
                                                                    title="Tamamla"
                                                                >
                                                                    <Check size={14} />
                                                                </Button>
                                                            )}

                                                            {req.status === 'COMPLETED' && (
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    size="sm"
                                                                    onClick={() => askForCancelConfirm(req)}
                                                                    title="İptal Et"
                                                                >
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

            {/* Doküman */}
            <Modal show={showDocModal} onHide={() => setShowDocModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Talep Doküman Yönetimi</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <h6>Yüklü Belgeler:</h6>
                        {attachments.length === 0 ? (
                            <p className="text-muted small">Bu talebe henüz belge eklenmemiş.</p>
                        ) : (
                            <ul className="list-group mb-3">
                                {attachments.map(doc => (
                                    <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span 
                                            onClick={() => handleDownloadDoc(doc.id, doc.file_name)}
                                            className="small text-truncate text-primary fw-medium"
                                            style={{ maxWidth: '250px', cursor: 'pointer', textDecoration: 'underline' }}
                                            title="Dosyayı İndir"
                                        >
                                            {doc.file_name}
                                        </span>
                                        <Button variant="link" size="sm" className="text-danger p-0" onClick={() => askForDocDeleteConfirm(doc.id)}>
                                            <Trash size={16} />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <form onSubmit={handleFileUpload}>
                        <div className="mb-3">
                            <label className="form-label">Yeni Belge Yükle</label>
                            <input type="file" className="form-control" onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    setFile(files[0]);
                                }
                            }} />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowDocModal(false)}>Kapat</Button>
                            <Button variant="primary" type="submit" disabled={uploading}>
                                {uploading ? <Spinner size="sm" animation="border" /> : <>Yükle</>}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Onay */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5 fw-bold text-dark">Talebi Tamamla</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        Bu talebi tamamlandı olarak işaretlemek istediğinizden emin misiniz?
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" className="px-3 bg-secondary border-0" onClick={() => setShowConfirmModal(false)}>
                        Kapat
                    </Button>
                    <Button variant="success" className="px-3 border-0" onClick={handleComplete}>
                        Tamamla
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDocDeleteModal} onHide={() => setShowDocDeleteModal(false)} size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5 fw-bold text-dark">Dokümanı Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        Bu dokümanı silmek istediğinizden emin misiniz?
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                    <Button variant="secondary" className="px-3 bg-secondary border-0" onClick={() => setShowDocDeleteModal(false)}>
                        Kapat
                    </Button>
                    <Button variant="danger" className="px-3 border-0" onClick={handleDeleteDoc}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>

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
        </Container>
    );
}