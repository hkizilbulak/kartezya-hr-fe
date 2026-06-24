'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Modal, Form } from 'react-bootstrap';
import { CheckCircle, MessageCircle, FileText, Upload, Trash } from 'react-feather';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';

interface Employee { id: number; first_name: string; last_name: string; phone: string; }
interface Attachment { id: string; file_name: string; }
interface OtherRequest {
    id: number; description: string; status: string; created_at: string;
    employee?: Employee; request_type?: { name: string };
    attachments?: Attachment[];
}

export default function OtherRequestsManagementPage() {
    const [requests, setRequests] = useState<OtherRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    
    // Dosya Modal State'leri
    const [showDocModal, setShowDocModal] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(HR_ENDPOINTS.OTHER_REQUESTS);
            setRequests(res.data.data || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Talepler yüklenemedi.');
        } finally { setLoading(false); }
    };

    const handleComplete = async (id: number) => {
        if (!window.confirm('Bu talebi tamamlandı işaretliyorsunuz?')) return;
        try {
            setProcessing(id);
            await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${id}/complete`);
            toast.success('Başarıyla tamamlandı.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'İşlem başarısız.');
        } finally { setProcessing(null); }
    };

    const openWhatsApp = (phone: string) => {
        if (!phone) {
            toast.warning('Kayıtlı cep telefonu bulunamadı.');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    // --- Doküman Yönetimi Fonksiyonları  ---
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
            await axiosInstance.post(`${HR_ENDPOINTS.OTHER_REQUESTS}/${selectedReqId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Dosya başarıyla yüklendi.');
            setFile(null);
            // Listeyi tazele
            fetchRequests();
            setShowDocModal(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Dosya yüklenemedi.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!window.confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return;
        try {
            await axiosInstance.delete(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${docId}`);
            toast.success('Doküman silindi.');
            setAttachments(attachments.filter(d => d.id !== docId));
            fetchRequests();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Silinemedi.');
        }
    };

    return (
        <div className="page-content">
            <h4 className="mb-4">Personel Talepleri Yönetimi (İK)</h4>
            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Çalışan Adı</th>
                                    <th>Tip</th>
                                    <th>Açıklama</th>
                                    <th>Tarih</th>
                                    <th>Durum</th>
                                    <th className="text-end">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="fw-medium">
                                            {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 'Bilinmiyor'}
                                        </td>
                                        <td>{req.request_type?.name}</td>
                                        <td style={{ maxWidth: '200px' }} className="text-truncate">{req.description}</td>
                                        <td>{dayjs(req.created_at).format('DD.MM.YYYY HH:mm')}</td>
                                        <td>
                                            {req.status === 'ACTIVE' && <Badge bg="warning">Bekliyor</Badge>}
                                            {req.status === 'COMPLETED' && <Badge bg="success">Tamamlandı</Badge>}
                                        </td>
                                        <td className="text-end">
                                            {/* Dosya Yükleme / Görüntüleme İkonu */}
                                            <Button 
                                                variant="outline-primary" size="sm" className="me-2"
                                                title="Doküman Yönetimi"
                                                onClick={() => openDocs(req)}
                                            >
                                                <FileText size={16} />
                                            </Button>

                                            {/* WhatsApp İletişim Butonu */}
                                            {req.employee?.phone && (
                                                <Button 
                                                    variant="outline-success" size="sm" className="me-2"
                                                    onClick={() => openWhatsApp(req.employee?.phone || '')}
                                                    title="WhatsApp ile İletişime Geç"
                                                >
                                                    <MessageCircle size={16} />
                                                </Button>
                                            )}
                                            
                                            {req.status === 'ACTIVE' && (
                                                <Button 
                                                    variant="success" size="sm"
                                                    onClick={() => handleComplete(req.id)}
                                                    disabled={processing === req.id}
                                                >
                                                    {processing === req.id ? <Spinner size="sm" animation="border"/> : <CheckCircle size={16}/>}
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

            <Modal show={showDocModal} onHide={() => setShowDocModal(false)}>
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
                                        <span className="small text-truncate" style={{ maxWidth: '250px' }}>{doc.file_name}</span>
                                        <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteDoc(doc.id)}>
                                            <Trash size={16} />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <Form onSubmit={handleFileUpload}>
                        <Form.Group className="mb-3">
                            <Form.Label>Yeni Belge Yükle</Form.Label>
                            <Form.Control type="file" onChange={(e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        setFile(files[0]);
    }
}} />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowDocModal(false)}>Kapat</Button>
                            <Button variant="primary" type="submit" disabled={uploading}>
                                {uploading ? <Spinner size="sm" animation="border" /> : <><Upload size={16} className="me-1"/> Yükle</>}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

const ReqId = 1;