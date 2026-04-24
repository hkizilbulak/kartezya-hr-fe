'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { employeeService } from '@/services/employee.service';
import { useAuth } from '@/hooks/useAuth';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';
import { IMaskInput } from 'react-imask';

export default function MissingInfoModal() {
    const { user } = useAuth();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact: ''
    });

    const [fullProfile, setFullProfile] = useState<any>(null);

    useEffect(() => {
        const checkProfile = async () => {
            if (!user) return;
            
            try {
                const response = await employeeService.getMyProfile();
                if (response.success && response.data) {
                    const profile = response.data;
                    setFullProfile(profile);
                    
                    const isMissing = !profile.phone || 
                                     !profile.email || 
                                     !profile.address || 
                                     !profile.emergency_contact_name || 
                                     !profile.emergency_contact;
                    
                    if (isMissing) {
                        setFormData({
                            phone: profile.phone || '',
                            email: profile.email || profile.company_email || user.email || '',
                            address: profile.address || '',
                            emergency_contact_name: profile.emergency_contact_name || '',
                            emergency_contact: profile.emergency_contact || ''
                        });
                        setShow(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile for missing info check:', error);
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMaskedInputChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.phone || !formData.email || !formData.address || !formData.emergency_contact_name || !formData.emergency_contact) {
            toast.error('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        try {
            setSaving(true);
            
            // Merge with existing profile data to prevent nullifying existing fields
            const updateData = {
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact: formData.emergency_contact,
                state: fullProfile?.state || '',
                city: fullProfile?.city || '',
                gender: fullProfile?.gender || '',
                date_of_birth: fullProfile?.date_of_birth || '',
                profession_start_date: fullProfile?.profession_start_date || '',
                marital_status: fullProfile?.marital_status || '',
                emergency_contact_relation: fullProfile?.emergency_contact_relation || '',
                mother_name: fullProfile?.mother_name || '',
                father_name: fullProfile?.father_name || '',
                nationality: fullProfile?.nationality || '',
                identity_no: fullProfile?.identity_no || ''
            };

            const response = await employeeService.updateMyProfile(updateData);

            if (response.success) {
                toast.success('Bilgileriniz başarıyla kaydedildi.');
                setShow(false);
            } else {
                toast.error(response.error || 'Bilgiler kaydedilirken bir hata oluştu');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Bilgiler kaydedilirken bir hata oluştu';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <Modal 
            show={show} 
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
        >
            <div className="position-relative">
                <LoadingOverlay show={saving} message="Kaydediliyor..." />
                <Modal.Header>
                    <Modal.Title>Eksik Bilgi Tamamlama</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-warning">
                        Portalımıza devam edebilmek için lütfen aşağıdaki zorunlu iletişim ve acil durum bilgilerinizi doldurun.
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Telefon Numarası <span className="text-danger">*</span></Form.Label>
                                    <IMaskInput
                                        className="form-control"
                                        mask="(000) 000 0000"
                                        value={formData.phone}
                                        name="phone"
                                        type="tel"
                                        placeholder="(5XX) XXX XXXX"
                                        onAccept={(value) => handleMaskedInputChange('phone', String(value ?? ''))}
                                        overwrite
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>E-posta <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleInputChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Acil Durumda Erişilecek Kişi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="emergency_contact_name" 
                                        value={formData.emergency_contact_name} 
                                        onChange={handleInputChange} 
                                        placeholder="Ad Soyad"
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Acil Durum Telefonu <span className="text-danger">*</span></Form.Label>
                                    <IMaskInput
                                        className="form-control"
                                        mask="(000) 000 0000"
                                        value={formData.emergency_contact}
                                        name="emergency_contact"
                                        type="tel"
                                        placeholder="(5XX) XXX XXXX"
                                        onAccept={(value) => handleMaskedInputChange('emergency_contact', String(value ?? ''))}
                                        overwrite
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Adres <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3}
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                                placeholder="Açık adresiniz"
                                required 
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" type="submit" disabled={saving}>
                                Kaydet ve Devam Et
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </div>
        </Modal>
    );
}
