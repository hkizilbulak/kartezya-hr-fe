'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, ListGroup, ProgressBar } from 'react-bootstrap';
import { Upload, X, Download, FileText } from 'react-feather';
import { toast } from 'react-toastify';
import axiosInstance from '@/helpers/api/axiosInstance';
import { HR_ENDPOINTS } from '@/contants/urls';
import { Attachment, getFileIcon, formatFileSize } from '@/models/common/attachment-models';

interface OtherRequestDocumentModalProps {
    show: boolean;
    onHide: () => void;
    reqId: number | null;
    initialAttachments: Attachment[];
    onSuccess: () => void;
    canDelete?: boolean;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

const OtherRequestDocumentModal: React.FC<OtherRequestDocumentModalProps> = ({
    show, onHide, reqId, initialAttachments, onSuccess, canDelete = true
}) => {
    // Stateler
    const [documents, setDocuments] = useState<Attachment[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (show && reqId) {
            setDocuments(Array.isArray(initialAttachments) ? initialAttachments : []);
            fetchDocuments();
        } else {
            setDocuments([]);
            setUploadingFiles([]);
        }
    }, [show, reqId]);

    const fetchDocuments = async () => {
        if (!reqId) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/${reqId}/documents`);
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setDocuments(data);
        } catch (err) {
            setDocuments([]);
            toast.error('Belgeler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const uploadFiles = async (files: File[]) => {
        const newUploads: UploadingFile[] = files.map(f => ({
            id: `${Date.now()}-${Math.random()}`, file: f, progress: 0, status: 'pending'
        }));
        setUploadingFiles(prev => [...prev, ...newUploads]);

        for (const uf of newUploads) {
            try {
                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'uploading', progress: 50 } : p));
                const formData = new FormData();
                formData.append('file', uf.file);

                await axiosInstance.post(
                    `${HR_ENDPOINTS.OTHER_REQUESTS}/${reqId}/documents`,
                    formData,
                    { headers: { 'Content-Type': undefined } }
                );

                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'success', progress: 100 } : p));

                await fetchDocuments();
                onSuccess();

                setTimeout(() => setUploadingFiles(prev => prev.filter(p => p.id !== uf.id)), 2000);
            } catch (err) {
                setUploadingFiles(prev => prev.map(p => p.id === uf.id ? { ...p, status: 'error', error: 'Yükleme başarısız' } : p));
                toast.error("Yükleme başarısız oldu.");
            }
        }
    };

    const handleDownload = async (documentId: string, fileName: string) => {
        try {
            // 1. URL bilgisini al
            const response = await axiosInstance.get(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${documentId}/download`);
            const fileUrl = response.data?.data?.url;

            if (!fileUrl) {
                toast.error('Dosya linki alınamadı.');
                return;
            }

            // 2. Aldığın URL'e gidip gerçek dosyayı indir
            const fileResponse = await fetch(fileUrl);

            if (!fileResponse.ok) {
                throw new Error('Dosya sunucudan çekilemedi.');
            }

            const blob = await fileResponse.blob();

            // 3. İndir
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Temizlik
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Dosya başarıyla indirildi.');

        } catch (err: any) {
            console.error("İndirme hatası:", err);
            toast.error('Dosya indirilemedi.');
        }
    };
    const handleDelete = async (documentId: string) => {
        try {
            await axiosInstance.delete(`${HR_ENDPOINTS.OTHER_REQUESTS}/documents/${documentId}`);
            toast.success('Doküman silindi.');
            await fetchDocuments();
            onSuccess();
        } catch (err) {
            toast.error('Silme başarısız.');
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title><FileText size={20} className="me-2" /> Talep Doküman Yönetimi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {canDelete && (
                    <>
                        <div
                            className={`border rounded p-4 text-center mb-4 ${isDragging ? 'border-primary bg-light' : 'border-secondary'}`}
                            onDragEnter={() => setIsDragging(true)}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const files = e.dataTransfer.files; if (files.length > 0) uploadFiles(Array.from(files)); }}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                        >
                            <Upload size={40} className="text-secondary mb-3" />
                            <p className="mb-2"><strong>Dosyaları buraya sürükleyin veya tıklayarak seçin</strong></p>

                            <p className="text-muted small mb-0">Desteklenen formatlar: PDF, JPG, PNG, GIF (Maks. 10MB)</p>
                            <p className="text-muted small mb-0">Birden fazla dosya seçebilirsiniz</p>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && uploadFiles(Array.from(e.target.files))} hidden multiple />
                    </>
                )}

                {uploadingFiles.map(uf => (
                    <div key={uf.id} className="mb-2">
                        <ProgressBar now={uf.progress} label={`${uf.file.name} - ${uf.progress}%`} variant={uf.status === 'error' ? 'danger' : 'info'} />
                    </div>
                ))}

                <h6>Yüklü Belgeler ({documents.length}):</h6>
                {loading ? <p>Yükleniyor...</p> : (
                    <ListGroup className="mb-3">
                        {documents.map(doc => (
                            <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">
                                <span className="d-flex align-items-center">
                                    {getFileIcon(doc.content_type || 'application/pdf')}
                                    <span className="ms-2">
                                        {doc.file_name}
                                        <small className="text-muted d-block">{formatFileSize(doc.file_size)}</small>
                                    </span>
                                </span>
                                <div>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleDownload(doc.id, doc.file_name)}><Download size={14} /></Button>
                                    {canDelete && (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(doc.id)}><X size={14} /></Button>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default OtherRequestDocumentModal;