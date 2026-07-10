'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, ProgressBar } from 'react-bootstrap';
import { settingsService } from '@/services/settings.service';
import { useAuth } from '@/hooks/useAuth';
import LoadingOverlay from '@/components/LoadingOverlay';
import { toast } from 'react-toastify';
import { Shield, AlertCircle, FileText, ChevronDown, Check, ArrowRight, ArrowLeft } from 'react-feather';

export default function KvkkModal() {
    const { user } = useAuth();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Wizard Steps: 1, 2, 3, 4
    const [step, setStep] = useState(1);

    // Scroll Read States
    const [readSteps, setReadSteps] = useState<{ [key: number]: boolean }>({
        1: false,
        2: false,
        3: false,
        4: true, // Photo consent card is short, defaults to read
    });

    // Accept/Read Choices
    const [choices, setChoices] = useState({
        kvkkTextAccepted: false,
        privacyPolicyAccepted: false,
        antiBriberyPolicyAccepted: false,
        photoConsentChoice: null as 'APPROVED' | 'REJECTED' | null,
    });

    // Scroll Container Refs
    const scrollRef1 = useRef<HTMLDivElement>(null);
    const scrollRef2 = useRef<HTMLDivElement>(null);
    const scrollRef3 = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkConsent = async () => {
            if (!user) return;
            try {
                const response = await settingsService.getUserSettings();
                if (response.success && response.data) {
                    const settings = response.data;
                    // If any of the required document consents are not met, show the modal.
                    const isComplete = settings.kvkk_text === 'READ' &&
                                      settings.privacy_policy === 'READ' &&
                                      settings.anti_bribery_policy === 'READ' &&
                                      (settings.photo_consent === 'APPROVED' || settings.photo_consent === 'REJECTED');
                    if (!isComplete) {
                        setShow(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching settings for KVKK check:', error);
            } finally {
                setLoading(false);
            }
        };

        checkConsent();
    }, [user]);

    const handleScroll = (stepNumber: number, ref: React.RefObject<HTMLDivElement>) => {
        const container = ref.current;
        if (!container || readSteps[stepNumber]) return;

        const isBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 25;
        if (isBottom) {
            setReadSteps(prev => ({ ...prev, [stepNumber]: true }));
        }
    };

    const handlePostpone = async () => {
        try {
            setSaving(true);
            const response = await settingsService.saveKvkkConsent({
                action: 'REMIND_LATER'
            });
            if (response.success) {
                toast.info('Onay ekranları bir sonraki girişinizde tekrar hatırlatılacaktır.');
                setShow(false);
            } else {
                toast.error(response.error || 'İşlem gerçekleştirilirken bir hata oluştu.');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'İşlem gerçekleştirilirken bir hata oluştu.';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!choices.kvkkTextAccepted || !choices.privacyPolicyAccepted || !choices.antiBriberyPolicyAccepted || !choices.photoConsentChoice) {
            toast.error('Lütfen tüm yasal metinleri onaylayıp açık rıza seçiminizi yapınız.');
            return;
        }

        try {
            setSaving(true);
            const response = await settingsService.saveKvkkConsent({
                action: 'SUBMIT',
                photo_consent: choices.photoConsentChoice,
                kvkk_text: 'READ',
                privacy_policy: 'READ',
                anti_bribery_policy: 'READ',
            });
            if (response.success) {
                toast.success('Yasal onaylarınız başarıyla kaydedildi.');
                setShow(false);
            } else {
                toast.error(response.error || 'İşlem gerçekleştirilirken bir hata oluştu.');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'İşlem gerçekleştirilirken bir hata oluştu.';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !choices.kvkkTextAccepted) {
            toast.warning('Devam etmeden önce metni okuyup onaylamanız gerekmektedir.');
            return;
        }
        if (step === 2 && !choices.privacyPolicyAccepted) {
            toast.warning('Devam etmeden önce gizlilik sözleşmesini onaylamanız gerekmektedir.');
            return;
        }
        if (step === 3 && !choices.antiBriberyPolicyAccepted) {
            toast.warning('Devam etmeden önce politikayı onaylamanız gerekmektedir.');
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
    };

    if (!show) {
        return null;
    }

    const progressValue = (step / 4) * 100;

    return (
        <Modal
            show={show}
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
            className="kvkk-modal"
        >
            <div className="position-relative">
                <LoadingOverlay show={saving} message="Tercihleriniz kaydediliyor..." />
                
                <Modal.Header className="border-bottom-0 pb-0 d-flex flex-column pt-4 px-4 align-items-stretch">
                    <div className="d-flex align-items-center gap-2 text-primary font-weight-bold mb-2">
                        <Shield size={28} className="text-success" />
                        <h5 className="mb-0 font-weight-bold">Yasal Uyum ve Sözleşme Onay Portalı</h5>
                    </div>
                    
                    {/* Step Indicators */}
                    <div className="d-flex justify-content-between align-items-center mb-3 mt-2" style={{ fontSize: '0.8rem' }}>
                        <div className={`font-weight-bold ${step === 1 ? 'text-primary' : 'text-muted'}`}>
                            1. Aydınlatma Metni {choices.kvkkTextAccepted && <Check size={14} className="text-success" />}
                        </div>
                        <div className={`font-weight-bold ${step === 2 ? 'text-primary' : 'text-muted'}`}>
                            2. Gizlilik Sözleşmesi {choices.privacyPolicyAccepted && <Check size={14} className="text-success" />}
                        </div>
                        <div className={`font-weight-bold ${step === 3 ? 'text-primary' : 'text-muted'}`}>
                            3. Rüşvet Politikası {choices.antiBriberyPolicyAccepted && <Check size={14} className="text-success" />}
                        </div>
                        <div className={`font-weight-bold ${step === 4 ? 'text-primary' : 'text-muted'}`}>
                            4. Açık Rıza {choices.photoConsentChoice && <Check size={14} className="text-success" />}
                        </div>
                    </div>
                    <ProgressBar now={progressValue} variant="success" style={{ height: '4px' }} className="mb-2" />
                </Modal.Header>

                <Modal.Body className="pt-2 px-4 pb-4">
                    <Alert variant="warning" className="d-flex align-items-start gap-2 mb-3 border-0 shadow-sm py-2" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                        <AlertCircle size={18} className="mt-1 flex-shrink-0" />
                        <div>
                            Kartezya Portal'ı kullanmaya devam edebilmek için <strong>{step}. adımdaki</strong> yasal metni okuyup onaylamanız gerekmektedir.
                        </div>
                    </Alert>

                    {/* Step 1: KVKK Aydınlatma Metni */}
                    {step === 1 && (
                        <div className="card border shadow-sm" style={{ borderRadius: '8px' }}>
                            <div className="card-header bg-light d-flex align-items-center gap-2 py-2">
                                <FileText size={18} className="text-secondary" />
                                <strong className="text-secondary">Personel Aydınlatma Metni</strong>
                            </div>
                            <div 
                                ref={scrollRef1}
                                onScroll={() => handleScroll(1, scrollRef1)}
                                className="p-3 overflow-auto" 
                                style={{ maxHeight: '300px', fontSize: '0.85rem', lineHeight: '1.6', color: '#4a4a4a' }}
                            >
                                <h6 className="text-center font-weight-bold mb-3">PERSONEL AYDINLATMA METNİ</h6>
                                <p>
                                    <strong>KARTEZYA BİLİŞİM DANIŞMANLIK VE TEKNOLOJİ HİZMETLERİ LTD. ŞTİ. (“Şirket”)</strong> olarak aşağıda yer alan veri konusu kişi gruplarına ait kişisel verilerin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“Kanun”), ikincil düzenlemeleri ve Kişisel Verileri Koruma Kurulu Kararlarına uygun olarak işlenmesi ve korunması için azami özen göstermekteyiz.
                                </p>
                                <p>
                                    Şirket, Personel Yönelik Aydınlatma Metni (“Aydınlatma Metni”) ile veri sorumlusu olarak kişisel verilerin işlenmesi ile ilgili personellerini bilgilendirmeyi amaçlamaktadır.
                                </p>
                                <p>
                                    <strong>Veri Sorumlusu:</strong> Fatih Sultan Mehmet Mah. Poligon Cad. Buyaka 2 Sitesi 3. Blok 8 C 1 Ümraniye/ İstanbul adresinde mukim KARTEZYA BİLİŞİM DANIŞMANLIK VE TEKNOLOJİ HİZMETLERİ LTD. ŞTİ.
                                </p>
                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">Hangi Kişisel Verilerinizi İşliyoruz?</h6>
                                <table className="table table-bordered table-sm mb-3" style={{ fontSize: '0.8rem' }}>
                                    <thead className="bg-light">
                                        <tr>
                                            <th style={{ width: '30%' }}>Veri Kategorisi</th>
                                            <th>İşlenen Kişisel Veriler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Kimlik</strong></td>
                                            <td>Ad, soyad, TCKN, doğum tarihi, cinsiyet</td>
                                        </tr>
                                        <tr>
                                            <td><strong>İletişim</strong></td>
                                            <td>GSM numarası, e-posta adresi, adres</td>
                                        </tr>
                                        <tr>
                                            <td><strong>İşlem Güvenliği</strong></td>
                                            <td>Kullanıcı adı, şifre, IP adres bilgileri, log kayıtları</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Görsel ve İşitsel</strong></td>
                                            <td>Fotoğraf, video kaydı</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p>
                                    Detaylı haklarınız için KVKK'nın 11. maddesi kapsamındaki haklar bölümünü inceleyiniz. Taleplerinizi <strong>info@kartezya.com</strong> adresine iletebilirsiniz.
                                </p>
                            </div>
                            <div className="card-footer bg-white d-flex align-items-center justify-content-between border-top py-2 px-3">
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    {!readSteps[1] ? (
                                        <span className="d-flex align-items-center gap-1">
                                            <ChevronDown size={14} className="animated-bounce" /> Metnin sonuna kadar kaydırınız
                                        </span>
                                    ) : (
                                        <span className="text-success font-weight-bold">✓ Metin sonuna ulaşıldı</span>
                                    )}
                                </span>
                                <Button 
                                    variant={choices.kvkkTextAccepted ? "success" : "outline-primary"}
                                    size="sm"
                                    disabled={!readSteps[1]}
                                    onClick={() => setChoices(prev => ({ ...prev, kvkkTextAccepted: !prev.kvkkTextAccepted }))}
                                >
                                    {choices.kvkkTextAccepted ? "✓ Okudum, Anladım" : "Okudum, Anladım"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Personel Gizlilik Sözleşmesi */}
                    {step === 2 && (
                        <div className="card border shadow-sm" style={{ borderRadius: '8px' }}>
                            <div className="card-header bg-light d-flex align-items-center gap-2 py-2">
                                <FileText size={18} className="text-secondary" />
                                <strong className="text-secondary">Personel Gizlilik Sözleşmesi</strong>
                            </div>
                            <div 
                                ref={scrollRef2}
                                onScroll={() => handleScroll(2, scrollRef2)}
                                className="p-3 overflow-auto" 
                                style={{ maxHeight: '300px', fontSize: '0.85rem', lineHeight: '1.6', color: '#4a4a4a' }}
                            >
                                <h6 className="text-center font-weight-bold mb-3">PERSONEL GİZLİLİK SÖZLEŞMESİ</h6>
                                <p>
                                    Bu sözleşme, (KARTEZYA BİLİŞİM DANIŞMANLIK VE TEKNOLOJİ HİZMETLERİ LİMİTED ŞİRKETİ.) (KURUM) ile tebliğ edilen ilgili kişi (PERSONEL) arasında akdedilmiştir.
                                </p>
                                <strong>1. TANIMLAR</strong>
                                <p>
                                    1.1. Gizlilik Dereceli Evrak ve Gerecin Güvenliği Hakkındaki Esaslar uyarınca etiketlenmiş her türlü ÇOK GİZLİ, GİZLİ, ÖZEL ve HİZMETE ÖZEL gizlilik derecesindeki bilgi ve belgeler.
                                </p>
                                <p>
                                    1.2. Kanun (KVKK) ile tanımlanan kişisel veriler ile Kişisel Sağlık Verileri.
                                </p>
                                <p>
                                    1.3. Kuruma veya hizmet sunulan birime ait özel sırlar, mali bilgiler, sistem bilgileri, donanım/yazılım ve personelin çalışma süresi içerisinde yapmış olduğu işler.
                                </p>
                                <strong>2. YÜKÜMLÜLÜKLER</strong>
                                <p>
                                    2.1. Personel, kuruma ait gizli kalması gereken bilgilerin korunması için belirtilen kurallara uyacağını beyan ve taahhüt eder.
                                </p>
                                <p>
                                    2.2. Bilgi Güvenliği Politikaları Yönergesi ve BGYS süreçlerine uygun davranır.
                                </p>
                                <p>
                                    2.3. Edindiği gizlilik arz eden her türlü bilgiyi sır olarak saklamakla ve üçüncü kişilerle paylaşmamakla yükümlüdür. Bu yükümlülük sözleşme sona erse dahi süresiz devam eder.
                                </p>
                                <p>
                                    2.4. Kurum bilgisayarı, e-posta hesabı, veri depolama ortamı yalnızca göreve yönelik kullanılır ve adli/idari soruşturma kapsamında bilgilendirmeksizin denetlenebilir.
                                </p>
                            </div>
                            <div className="card-footer bg-white d-flex align-items-center justify-content-between border-top py-2 px-3">
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    {!readSteps[2] ? (
                                        <span className="d-flex align-items-center gap-1">
                                            <ChevronDown size={14} className="animated-bounce" /> Metnin sonuna kadar kaydırınız
                                        </span>
                                    ) : (
                                        <span className="text-success font-weight-bold">✓ Metin sonuna ulaşıldı</span>
                                    )}
                                </span>
                                <Button 
                                    variant={choices.privacyPolicyAccepted ? "success" : "outline-primary"}
                                    size="sm"
                                    disabled={!readSteps[2]}
                                    onClick={() => setChoices(prev => ({ ...prev, privacyPolicyAccepted: !prev.privacyPolicyAccepted }))}
                                >
                                    {choices.privacyPolicyAccepted ? "✓ Okudum, Anladım" : "Okudum, Anladım"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Rüşvet ve Yolsuzlukla Mücadele Politikası */}
                    {step === 3 && (
                        <div className="card border shadow-sm" style={{ borderRadius: '8px' }}>
                            <div className="card-header bg-light d-flex align-items-center gap-2 py-2">
                                <FileText size={18} className="text-secondary" />
                                <strong className="text-secondary">Rüşvet ve Yolsuzlukla Mücadele Politikası</strong>
                            </div>
                            <div 
                                ref={scrollRef3}
                                onScroll={() => handleScroll(3, scrollRef3)}
                                className="p-3 overflow-auto" 
                                style={{ maxHeight: '300px', fontSize: '0.85rem', lineHeight: '1.6', color: '#4a4a4a' }}
                            >
                                <h6 className="text-center font-weight-bold mb-3">RÜŞVET VE YOLSUZLUKLA MÜCADELE POLİTİKASI</h6>
                                <strong>MADDE 1. AMAÇ</strong>
                                <p>
                                    1.1. Şirketimiz'in rüşvet ve yolsuzluk konusundaki yaklaşımının sıfır tolerans prensibinde açıkça belirtilmesidir.
                                </p>
                                <strong>MADDE 2. İLKELER</strong>
                                <p>
                                    2.1. Etik değerler; adalet, dürüstlük, tarafsızlık ve sorumluluk temel alınarak iş ortaklığı ilişkilerinde şeffaflık sağlanır.
                                </p>
                                <strong>MADDE 3. KAPSAM</strong>
                                <p>
                                    3.1. Yönetim Kurulu üyeleri, yöneticiler, çalışanlar ve kurum adına hareket eden tüm iş ortaklarını kapsar.
                                </p>
                                <strong>MADDE 4. UYGULAMA ESASLARI</strong>
                                <p>
                                    4.1. Nakit ödemeler, siyasi bağışlar, kolaylaştırıcı ödemeler, rüşvet ve yolsuzluk içeren her türlü eylemin gerçekleştirilmesi veya teklif edilmesi kesinlikle yasaktır.
                                </p>
                                <p>
                                    4.2. Şirket muhasebe kayıtları tam, şeffaf ve doğru şekilde tutulur; kayıt dışı işlemlere izin verilmez.
                                </p>
                                <p>
                                    4.3. İhlal veya şüpheli eylemler İK personeline veya <strong>0542 821 88 89</strong> nolu Bildirim Hattına (Hotline) iletilebilir.
                                </p>
                            </div>
                            <div className="card-footer bg-white d-flex align-items-center justify-content-between border-top py-2 px-3">
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    {!readSteps[3] ? (
                                        <span className="d-flex align-items-center gap-1">
                                            <ChevronDown size={14} className="animated-bounce" /> Metnin sonuna kadar kaydırınız
                                        </span>
                                    ) : (
                                        <span className="text-success font-weight-bold">✓ Metin sonuna ulaşıldı</span>
                                    )}
                                </span>
                                <Button 
                                    variant={choices.antiBriberyPolicyAccepted ? "success" : "outline-primary"}
                                    size="sm"
                                    disabled={!readSteps[3]}
                                    onClick={() => setChoices(prev => ({ ...prev, antiBriberyPolicyAccepted: !prev.antiBriberyPolicyAccepted }))}
                                >
                                    {choices.antiBriberyPolicyAccepted ? "✓ Okudum, Anladım" : "Okudum, Anladım"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Fotoğraf ve Video Açık Rıza Metni */}
                    {step === 4 && (
                        <div className="card border-info mb-0" style={{ borderRadius: '8px', backgroundColor: '#f4fbfe', borderColor: '#31d2f2' }}>
                            <div className="card-header bg-info text-white py-2">
                                <strong style={{ fontSize: '0.9rem' }}>4. FOTOĞRAF VE VİDEO PAYLAŞIMI AÇIK RIZA BEYANI</strong>
                            </div>
                            <div className="card-body p-3 animate-fade-in" style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#1a3a4b' }}>
                                <p className="mb-2">
                                    <strong>Kartezya Bilişim Danışmanlık ve Teknoloji Hizmetleri Ltd. Şti. ("Şirket")</strong> bünyesinde düzenlenen kurum içi etkinlikler, kutlamalar, toplantılar ve eğitimler sırasında çekilmiş fotoğraflarımın ve video kayıtlarımın; Şirket'in kurumsal sosyal medya hesaplarında (LinkedIn, Instagram vb.), resmi web sitesinde ve iç iletişim portalında paylaşılmasına;
                                </p>
                                <p className="mb-3 font-weight-bold text-dark">
                                    Konuyla ilgili tarafıma sunulan Personel Aydınlatma Metni'ni okuduğumu, haklarımı anladığımı bilerek, hiçbir baskı altında kalmadan özgür irademle AÇIK RIZA VERİYORUM / KABUL EDİYORUM.
                                </p>
                                
                                <div className="d-flex justify-content-center gap-3 mt-3">
                                    <Button
                                        variant={choices.photoConsentChoice === 'REJECTED' ? 'danger' : 'outline-danger'}
                                        onClick={() => setChoices(prev => ({ ...prev, photoConsentChoice: 'REJECTED' }))}
                                        className="px-4 py-2"
                                        style={{ minWidth: '150px', borderRadius: '6px' }}
                                    >
                                        Kabul Etmiyorum
                                    </Button>
                                    <Button
                                        variant={choices.photoConsentChoice === 'APPROVED' ? 'success' : 'outline-success'}
                                        onClick={() => setChoices(prev => ({ ...prev, photoConsentChoice: 'APPROVED' }))}
                                        className="px-4 py-2"
                                        style={{ minWidth: '150px', borderRadius: '6px' }}
                                    >
                                        Kabul Ediyorum
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="border-top-0 pt-0 px-4 pb-4 d-flex flex-column align-items-center gap-3">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        {step > 1 ? (
                            <Button 
                                variant="outline-secondary" 
                                onClick={prevStep}
                                className="d-flex align-items-center gap-1"
                                style={{ borderRadius: '6px' }}
                            >
                                <ArrowLeft size={16} /> Geri
                            </Button>
                        ) : (
                            <div></div>
                        )}

                        {step < 4 ? (
                            <Button 
                                variant="primary" 
                                onClick={nextStep}
                                className="d-flex align-items-center gap-1"
                                style={{ borderRadius: '6px' }}
                            >
                                İleri <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button 
                                variant="success" 
                                onClick={handleSubmit}
                                disabled={!choices.photoConsentChoice || saving}
                                className="d-flex align-items-center gap-1"
                                style={{ borderRadius: '6px' }}
                            >
                                Onayları Kaydet ve Tamamla <Check size={16} />
                            </Button>
                        )}
                    </div>
                    
                    <button
                        type="button"
                        onClick={handlePostpone}
                        disabled={saving}
                        className="btn btn-link text-decoration-none font-weight-bold text-muted p-0 hover-dark mt-2"
                        style={{ fontSize: '0.85rem', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        Daha Sonra Hatırlat
                    </button>
                </Modal.Footer>
            </div>

            <style jsx global>{`
                .kvkk-modal .modal-content {
                    border-radius: 12px;
                    border: none;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }
                .animated-bounce {
                    animation: bounce 1.5s infinite;
                }
                .hover-dark:hover {
                    color: #212529 !important;
                    text-decoration: underline !important;
                }
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(4px);
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Modal>
    );
}
