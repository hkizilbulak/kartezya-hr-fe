'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { PageHeading } from '@/widgets';
import LoadingOverlay from '@/components/LoadingOverlay';
import FormDateField from '@/components/FormDateField';
import { Edit, Trash2 } from 'react-feather';
import { kspeakerService, KspeakerVoucher } from '@/services/kspeaker.service';

export default function KspeakerVouchersPage() {
    const [vouchers, setVouchers] = useState<KspeakerVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [deviceId, setDeviceId] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [editingVoucherId, setEditingVoucherId] = useState<number | string | null>(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState<number | string | null>(null);

    useEffect(() => {
        loadVouchers();
    }, []);

    const loadVouchers = async () => {
        try {
            setLoading(true);
            const res = await kspeakerService.getVouchers(1, 100);
            if (res && Array.isArray(res.vouchers)) {
                setVouchers(res.vouchers);
            } else {
                setVouchers([]);
            }
        } catch (error: any) {
            console.error('Liste yüklenemedi:', error);
            toast.error(error.message || 'Voucher listesi yüklenemedi. Proxy ayarlarınızı kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!deviceId) {
            toast.warning('Device ID zorunludur.');
            return;
        }

        if (!expiresAt) {
            toast.warning('Son Kullanma Tarihi (expiresAt) zorunludur.');
            return;
        }

        // Format to ISO 8601 UTC if standard date is selected (e.g. 2026-12-30 -> 2026-12-30T00:00:00Z)
        let formattedExpiresAt = expiresAt;
        if (expiresAt.length === 10) { // YYYY-MM-DD
            formattedExpiresAt = `${expiresAt}T23:59:59Z`;
        }

        try {
            setSubmitting(true);
            const payload = {
                userDeviceId: deviceId,
                expiresAt: formattedExpiresAt
            };

            if (editingVoucherId !== null) {
                await kspeakerService.updateVoucher(editingVoucherId, payload);
                toast.success('Voucher başarıyla güncellendi.');
            } else {
                await kspeakerService.createVoucher(payload);
                toast.success('Voucher başarıyla oluşturuldu.');
            }

            // Reset form and reload
            resetForm();
            loadVouchers();
        } catch (error: any) {
            toast.error(error.message || 'İşlem başarısız oldu.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setDeviceId('');
        setExpiresAt('');
        setEditingVoucherId(null);
    };

    const handleEdit = (voucher: KspeakerVoucher) => {
        const id = voucher.id ?? voucher.userDeviceId ?? voucher.usedByDeviceId;
        if (id !== undefined) {
             setEditingVoucherId(id);
        }
        setDeviceId(voucher.usedByDeviceId || voucher.userDeviceId || '');
        
        // Extract YYYY-MM-DD from ISO string for the date picker
        let d = voucher.expiresAt || '';
        if (d && d.length >= 10) {
            d = d.substring(0, 10);
        }
        setExpiresAt(d);
    };

    const handleDeleteClick = (id?: string | number) => {
        if (id === undefined) return;
        setVoucherToDelete(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (voucherToDelete === null) return;
        
        try {
            setLoading(true);
            await kspeakerService.deleteVoucher(voucherToDelete);
            toast.success('Voucher başarıyla silindi.');
            setShowDeleteModal(false);
            setVoucherToDelete(null);
            loadVouchers();
        } catch (error: any) {
            toast.error(error.message || 'Silinirken bir hata oluştu.');
            setLoading(false);
        }
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <Container fluid className="px-6 py-4">
            <LoadingOverlay show={loading || submitting} message="Lütfen bekleyin..." />
            
            <PageHeading 
                heading="Kspeaker Voucher Yönetimi"
                showCreateButton={false}
                showFilterButton={false}
            />

            <Row>
                {/* Form Section */}
                <Col lg={4} className="mb-4">
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white py-3">
                            <h4 className="mb-0">{editingVoucherId !== null ? 'Voucher Güncelle' : 'Yeni Voucher Oluştur'}</h4>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Örn: ios_moh1h1s6_b50i5h"
                                        value={deviceId}
                                        onChange={(e) => setDeviceId(e.target.value)}
                                        required
                                        disabled={editingVoucherId !== null} // Assume device ID shouldn't be edited
                                    />
                                    {editingVoucherId !== null && <Form.Text className="text-muted">Device ID güncellenemez.</Form.Text>}
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <FormDateField 
                                        label="Geçerlilik Tarihi"
                                        name="expiresAt"
                                        value={expiresAt}
                                        onChange={(e: any) => setExpiresAt(e.target.value)}
                                        required={true}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit" disabled={submitting}>
                                        {editingVoucherId !== null ? 'Değişiklikleri Kaydet' : 'Voucher Oluştur'}
                                    </Button>
                                    {editingVoucherId !== null && (
                                        <Button variant="light" type="button" onClick={resetForm}>
                                            İptal
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* List Section */}
                <Col lg={8} className="mb-4">
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Voucher Listesi</h4>
                            <Button variant="outline-secondary" size="sm" onClick={loadVouchers}>
                                Yenile
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="text-nowrap mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Kod</th>
                                            <th>Device ID</th>
                                            <th>Bitiş Tarihi</th>
                                            <th>Oluşturulma Tarihi</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vouchers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4 text-muted">
                                                    Kayıtlı voucher bulunamadı.
                                                </td>
                                            </tr>
                                        ) : (
                                            vouchers.map((voucher, index) => {
                                                const rowKey = voucher.id ?? voucher.code ?? `idx_${index}`;
                                                return (
                                                    <tr key={rowKey}>
                                                        <td className="align-middle fw-medium">
                                                            {voucher.code || '-'}
                                                        </td>
                                                        <td className="align-middle">
                                                            {voucher.usedByDeviceId || voucher.userDeviceId || '-'}
                                                        </td>
                                                        <td className="align-middle text-muted">
                                                            {formatDateDisplay(voucher.expiresAt)}
                                                        </td>
                                                        <td className="align-middle text-muted">
                                                            {formatDateDisplay(voucher.createdAt)}
                                                        </td>
                                                        <td className="align-middle">
                                                            {voucher.active !== undefined ? (
                                                              <Badge bg={voucher.active ? 'success' : 'secondary'}>
                                                                  {voucher.active ? 'Aktif' : 'Pasif'}
                                                              </Badge>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="align-middle text-end">
                                                            <div className="d-flex justify-content-end w-100">
                                                              <div className="d-flex gap-2">
                                                                <Button 
                                                                    variant="outline-primary" 
                                                                    size="sm" 
                                                                    title="Düzenle"
                                                                    onClick={() => handleEdit(voucher)}
                                                                >
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    size="sm"
                                                                    title="Sil"
                                                                    onClick={() => handleDeleteClick(voucher.id ?? voucher.userDeviceId ?? voucher.usedByDeviceId)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                              </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => !loading && setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Voucher'ı Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Bu voucher'ı silmek istediğinizden emin misiniz?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowDeleteModal(false)}
                        disabled={loading}
                    >
                        İptal
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleConfirmDelete}
                        disabled={loading}
                    >
                        {loading ? 'Siliniyor...' : 'Sil'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
