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

            // Eğer bu oturumda ertelenmiş veya onaylanmışsa tekrar gösterme
            const isPostponedInSession = typeof window !== 'undefined' && sessionStorage.getItem('kvkk_postponed') === 'true';
            const isSubmittedInSession = typeof window !== 'undefined' && sessionStorage.getItem('kvkk_submitted') === 'true';
            
            if (isPostponedInSession || isSubmittedInSession) {
                setShow(false);
                setLoading(false);
                return;
            }

            try {
                const response = await settingsService.getUserSettings();
                let isComplete = false;
                
                if (response.success && response.data) {
                    const settings = response.data;
                    isComplete = settings.kvkk_text === 'READ' &&
                                 settings.privacy_policy === 'READ' &&
                                 settings.anti_bribery_policy === 'READ' &&
                                 (settings.photo_consent === 'APPROVED' || settings.photo_consent === 'REJECTED');
                }
                
                if (!isComplete) {
                    setShow(true);
                } else {
                    setShow(false);
                }
            } catch (error) {
                console.error('Error fetching settings for KVKK check:', error);
                // Hata durumunda (örneğin BE bağlantısı kesilirse) kullanıcı deneyimini bozmamak için modalı açmıyoruz
                setShow(false);
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
                // Bu oturumda tekrar göstermemek için sessionStorage'a kaydediyoruz
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('kvkk_postponed', 'true');
                }
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
                // Bu oturumda tekrar göstermemek için sessionStorage'a kaydediyoruz
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('kvkk_submitted', 'true');
                }
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
                        <div className={`font-weight-bold ${step === 4 ? 'text-primary' : 'text-muted'} pe-4`}>
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
                                    <strong>Veri Sorumlusu:</strong> Fatih Sultan Mehmet Mah. Poligon Cad. Buyaka 2 Sitesi 3. Blok 8 C 1 Ümraniye/ İstanbul adresinde mukim KARTEZYA BİLİŞİM DANIŞMANLIK VE TEKNOLOJİ HİZMETLERİ LTD. ŞTİ
                                </p>
                                
                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">Hangi Kişisel Verilerinizi İşliyoruz?</h6>
                                <div className="table-responsive mb-3">
                                    <table className="table table-bordered table-sm mb-0" style={{ fontSize: '0.8rem', width: '100%', tableLayout: 'fixed', wordBreak: 'break-word' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '30%', wordBreak: 'break-word', whiteSpace: 'normal' }}>Veri Kategorisi</th>
                                                <th style={{ width: '70%', wordBreak: 'break-word', whiteSpace: 'normal' }}>İşlenen Kişisel Veriler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>Kimlik</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Ad, soyad, TCKN, anne-baba adı, doğum tarihi, doğum yeri, medeni hali, nüfus cüzdanı seri no, cinsiyet, nüfusa kayıtlı olduğu il/ilçe, mahalle/köy, kimlik üzerindeki fotoğraf, uyruk</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>İletişim</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>GSM numarası, e-posta adresi, adres, şehir ve semt bilgisi, posta kodu, faks numarası</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>İşlem Güvenliği</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Kullanıcı adı, şifre, IP adres bilgileri, log kayıtları, cihaz seri no ve marka</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>Hukuki İşlem</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Adli makamlarla yazışmalardaki bilgiler, Kanun’dan kaynaklı ilgili kişi başvurularında yer alan bilgiler, yargı süreçlerinde düzenlenen her türlü evrakta bulunan bilgiler</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>Finans Bilgileriniz</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>IBAN, banka ve hesap bilgileri, kredi ve risk bilgileri</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>Mesleki Deneyim</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Mezuniyet bilgileri, geçmiş iş deneyimleri, gidilen kurslar</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>Görsel ve İşitsel Kayıtlar</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Fotoğraf, video kaydı</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">Veri Konusu Kişi Grubu</h6>
                                <div className="table-responsive mb-3">
                                    <table className="table table-bordered table-sm mb-0" style={{ fontSize: '0.8rem', width: '100%', tableLayout: 'fixed', wordBreak: 'break-word' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '30%', wordBreak: 'break-word', whiteSpace: 'normal' }}>GRUP</th>
                                                <th style={{ width: '30%', wordBreak: 'break-word', whiteSpace: 'normal' }}>GRUP</th>
                                                <th style={{ width: '40%', wordBreak: 'break-word', whiteSpace: 'normal' }}>AÇIKLAMA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}><strong>PERSONEL</strong></td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Firma Personeli</td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Şirket bünyesinde tam zamanlı, yarı zamanlı, belirli veya belirsiz süreli iş sözleşmesi ile istihdam edilen çalışanlar</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">Kişisel Verilerinizi Hangi Yöntemlerle, Hangi Amaçlarla ve Hukuki Sebeplere Dayanarak İşliyoruz?</h6>
                                <p>
                                    Kişisel verileriniz internet sitemiz ve portalımız üzerinden doldurduğunuz formlar, yapmış olduğunuz girişler, e-posta ve telefon vasıtasıyla elektronik ve fiziki ortamda işlenmektedir.
                                </p>
                                <p>
                                    <strong>a) Kişisel verileriniz, KVKK'nın 5. maddesinde belirtilen hukuki sebeplere dayanarak aşağıdaki amaçlarla işlenmektedir:</strong>
                                </p>
                                <p><strong>Personel</strong></p>
                                <div className="table-responsive mb-3">
                                    <table className="table table-bordered table-sm mb-0" style={{ fontSize: '0.8rem', width: '100%', tableLayout: 'fixed', wordBreak: 'break-word' }}>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '40%', wordBreak: 'break-word', whiteSpace: 'normal' }}>Kişisel Veri-Hukuki Sebep</th>
                                                <th style={{ width: '60%', wordBreak: 'break-word', whiteSpace: 'normal' }}>Veri İşleme Amaçları</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>Kanunlarda açıkça öngörülmesi" ve "Hukuki yükümlülüğün yerine getirilmesi" şartlarına dayalı olarak</td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>• İş Kanunu, SGK Mevzuatı ve İş Sağlığı ve Güvenliği Kanunu kapsamındaki yasal yükümlülüklerin yerine getirilmesi, özlük dosyalarının oluşturulması, adli makamlardan gelen resmi taleplerin karşılanması.</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>"Sözleşmenin kurulması veya ifası" şartına dayalı olarak</td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>• İş sözleşmesi kapsamında yer alan yükümlülüklerin (maaş, prim ve yan hakların ödenmesi vb.) yerine getirilmesi.</td>
                                            </tr>
                                            <tr>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>"Veri sorumlusunun meşru menfaati" şartına dayalı olarak</td>
                                                <td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>• Şirket içi operasyonlerin, bilgi güvenliğinin ve denetim süreçlerinin yönetilmesi, performans değerlendirme sistemlerinin yürütülmesi.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">Kişisel Verileriniz Hangi Amaçlarla Üçüncü Kişilere Aktarılır?</h6>
                                <p>
                                    Şirket olarak kişisel verilerinizi işbu Aydınlatma Metni’nde belirtilen amaçlar doğrultusunda ve Kanun’un 8. Maddesine uygun olarak üçüncü kişilere aktarmaktayız.
                                </p>
                                <ul>
                                    <li>Maaş ve ödemelerin yapılabilmesi amacıyla anlaşmalı olduğumuz <strong>Bankalara</strong> aktarılmaktadır.</li>
                                    <li>Kanuni bildirimlerin yapılması amacıyla <strong>SGK, Vergi Daireleri, İŞKUR</strong> başta olmak üzere yetkili kamu kurum ve kuruluşlarına,</li>
                                    <li>Muhasebe, vergi ve bağımsız denetim süreçlerinin yürütülmesi amacıyla danışmanlık aldığımız <strong>Mali Müşavirlere ve Denetim Firmalarına</strong> aktarılabilmektedir.</li>
                                </ul>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">KVKK Kapsamındaki Haklarınız</h6>
                                <p>
                                    KVKK'nın 11. maddesi uyarınca Şirketimize başvurarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme ve mevzuatta öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.
                                </p>
                                <p>
                                    Bu haklarınızı kullanmak için taleplerinizi yazılı olarak yukarıda belirtilen Şirket adresimize veya güvenli elektronik imza/mobil imza ile <strong>info@kartezya.com</strong> e-posta adresine iletebilirsiniz.
                                </p>
                                <p>Başvurunuzda;</p>
                                <ul>
                                    <li>Adınızın, soyadınızın ve başvurunuz yazılı ise imzanızın,</li>
                                    <li>Türkiye Cumhuriyeti vatandaşları için T.C. kimlik numarasının, yabancılar için uyruğun, pasaport numarasının veya varsa kimlik numarasının,</li>
                                    <li>Tebligata esas yerleşim yeri veya iş yeri adresinin,</li>
                                    <li>Varsa bildirime esas elektronik posta adresinin, telefon ve faks numarasının,</li>
                                    <li>Talep konusunun,</li>
                                </ul>
                                <p>bulunması zorunludur.</p>
                                <p>
                                    <strong>Mail Adresi:</strong> info@kartezya.com<br />
                                    <strong>Adres:</strong> Fatih Sultan Mehmet Mah. Poligon Cd. Buyaka 2 Sitesi 3. Blok 8C1 Ümraniye/ İstanbul
                                </p>
                                <p className="text-muted font-italic text-center mt-2">
                                    (İşbu Aydınlatma Metni yalnızca kişisel verilerinizin ne şekilde işlendiği hakkında bilgi içermektedir)
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
                                    Bu sözleşme, aşağıda yer alan hükümler çerçevesinde, <strong>(KARTEZYA BİLİŞİM DANIŞMANLIK VE TEKNOLOJİ HİZMETLERİ LİMİTED ŞİRKETİ.) (KURUM olarak anılacaktır)</strong> ile tebliğ edilen ilgili kişi <strong>(PERSONEL olarak anılacaktır)</strong> arasında akdedilmiştir.
                                </p>
                                
                                <h6 className="font-weight-bold mt-3 mb-2 text-secondary">1. TANIMLAR:</h6>
                                <p><strong>Kuruma Ait Gizli Kalması Gereken Bilgiler:</strong></p>
                                <p>
                                    1.1. 13/05/1964 tarihli ve 6/3048 sayılı Bakanlar Kurulu kararı ile yürürlüğe konulan “Gizlilik Dereceli Evrak ve Gerecin Güvenliği Hakkındaki Esaslar” ile tanımlanmış ve usulüne uygun olarak etiketlenmiş olan ÇOK GİZLİ, GİZLİ, ÖZEL ve HİZMETE ÖZEL gizlilik derecesindeki her türlü veri, bilgi ve belge.
                                </p>
                                <p>
                                    1.2. Kurum tarafından işlenen (24/03/2016 tarihli ve 6698 sayılı Kişisel Verilerin Korunması Kanunu ile tanımlanan) kişisel veriler ile (21/06/2019 tarihli ve 30888 sayılı Kişisel Sağlık Verileri Hakkında Yönetmelik ile tanımlanan) kişisel sağlık verileri.
                                </p>
                                <p>
                                    1.3. Kuruma veya hizmet sunulan birime ait özel sırlar, mali bilgiler, çalışan bilgileri, sistem bilgileri ve çalışılan süre içinde derlenen tüm bilgiler, materyaller, programlar ve dokümanlar, bilgisayar sistemleri içerisinde saklanan veriler, donanım/yazılım ve tüm diğer düzenleme ve uygulamalar ile personelin çalışma süresi içerisinde yapmış olduğu işler.
                                </p>
                                <p>
                                    1.4. Açıklanması halinde kişi ve kurumlara maddi veya manevi zarar verme ya da herhangi bir kişi veya kuruma haksız yarar sağlama ihtimali bulunan her türlü bilgi ve belge.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">2. YÜKÜMLÜLÜKLER:</h6>
                                <p>
                                    2.1. Personel, kuruma ait gizli kalması gereken bilgilerin korunması için aşağıdaki kurallara uyacağının beyanı olarak bu sözleşmeyi imzalar.
                                </p>
                                <p>
                                    2.2. Personel, Kurum Bilgi Güvenliği Politikaları Yönergesi ve Bilgi Güvenliği Politikaları Kılavuzunda yer alan koşullara uygun hareket eder.
                                </p>
                                <p>
                                    2.3. Personel, Kurum tarafından düzenlenen bilgi güvenliği farkındalık eğitimleri ile kişisel verilerin korunmasına ilişkin eğitimlere katılır ve bu eğitimlerde anlatılan hususlara riayet eder.
                                </p>
                                <p>
                                    2.4. Personel, bu sözleşme hükümlerine uygun davranmaktan, ihlali halinde ise Kuruma ve üçüncü kişilere vereceği her türlü zarardan sorumludur. Sözleşmenin ihlal edilmesi sonucu doğacak tüm hukuki ve cezai sorumlukları peşinen kabul eder.
                                </p>
                                <p>
                                    2.5. Personel, Kurumda uygulanmakta olan Bilgi Güvenliği Yönetim Sistemi (BGYS) kapsamında yayımlanmış politika, prosedür, süreç ve sözleşmelere uygun davranır. Bahse konu dokümanlarda belirtilen hususları yerine getirir.
                                </p>
                                <p>
                                    2.6. Personel, Kurum tarafından kendisine teslim edilmiş veya erişim yetkisi verilmiş olan gizli kalması gereken bilgileri, sadece görevi ile ilgili işler için kullanür. Bu bilgileri kendi gizli bilgisi gibi korur ve bilmesi gereken yetkili kişiler haricinde, hiç kimse ile paylaşmaz. Personel, bilgi paylaşabileceği kişiler konusunda tereddütte kalırsa, bir üst amiri ile irtibata geçerek bu bilgileri kimlerle paylaşabileceğini teyit eder.
                                </p>
                                <p>
                                    2.7. Personel, özel olarak yetkilendirildiği durumlar dışında, hizmet verilen tarafların yetkilileri de dâhil olmak üzere yetkisi olmayan hiçbir kimse ile gizli kalması gereken bilgileri paylaşmaz. Yetkisi olmadığı halde, bulunduğu görev ve makamı kullanarak kendisinden bu bilgileri talep eden kişileri, yöneticisine bildirir.
                                </p>
                                <p>
                                    2.8. Personel, gizli kalması gereken bilgileri hiçbir kişi, grup, kurum veya kuruluşun menfaati için kullanamaz.
                                </p>
                                <p>
                                    2.9. Personel, görevi ile ilgili olsun veya olmasın, edindiği ve gizlilik arz eden her türlü bilgiyi sır olarak saklamak ve bunları üçüncü kişiler ile hiçbir şekilde paylaşmamakla yükümlüdür. Bu yükümlülük, personelin Kurum ile ilişkisinin sona ermesi halinde de süresiz olarak devam eder.
                                </p>
                                <p>
                                    2.10. Personel, görevi nedeniyle edindiği gizli bilgiler hakkında, yasal zorunluluklar ve kurum tarafından resmi olarak izin verilmesi halleri dışında yazılı veya sözlü açıklama yapamaz.
                                </p>
                                <p>
                                    2.11. Personel, görevi kapsamında erişim hakkının bulunduğu sistemleri ve bilgileri, yetkisi içinde ya da yetkisini aşarak kendisine veya bir başkasına çıkar sağlamak amacıyla kullanamaz.
                                </p>
                                <p>
                                    2.12. Personel, Kurumun bilgisi veya onayı dışında, proje ve faaliyetlerde kullanılan veriler ve sistemler üzerinde, görevin gerektirdiği iş ve işlemler dışında değişiklik yapamaz.
                                </p>
                                <p>
                                    2.13. Personel, hangi amaçla olursa olsun görevi kapsamında edindiği bilgileri, proje ve faaliyetlerde kullanılan çeşitli şekillerde (basılı, dijital, manyetik vb.) bulunabilecek olan verileri yetkisiz ve izinsiz olarak kullanamaz, kopyalayamaz, taşıyamaz ve aktaramaz.
                                </p>
                                <p>
                                    2.14. Personel, Kurum tarafından kendisine verilen bilgisayar, tablet, telefon, taşınabilir medya gibi cihazları sadece göreve yönelik, kurumsal faaliyetler için kullanır. Yürütülecek adli ve idari soruşturmalar kapsamında olmak şartıyla, söz konusu cihazlar ve personelin kurum bilişim sistemleri üzerinde yapmış olduğu işlemler, personele ayrıca herhangi bir bilgilendirme yapılmaksızın, kontrol edilebilir. Bu cihazlarda, kurumun bilgisi dışında hiçbir mekanik ya da yazılımsal yapılandırma değişikliği yapamaz.
                                </p>
                                <p>
                                    2.15. Personel, sistemlere erişim için kullandığı kullanıcı adı/parolayı hiçbir şekilde başkaları ile paylaşmaz. Parolasının gizli kalması için gereken tüm tedbirleri alır. Kurumdan ayrılması halinde kullanıcı adı/parolayı iptal ettirir. Kullandığı bilgisayar ve/veya diğer veri depolama ortamlarına oluşturduğu veri, bilgi ve belgeler dâhil tüm belgeleri, cihazları ve ofis malzemelerini eksiksiz olarak ilgilisine teslim eder ve bunların kopyasını alamaz.
                                </p>
                                <p>
                                    2.16. Personel, Kurum sunucuları üzerinden kendisine tahsis edilen e-imza/mobil imza, kullanıcı adı/parola ve/veya IP/MAC adresini kullanarak gerçekleştirdiği her türlü etkinlikten, kurum bilişim kaynakları kullanılarak oluşturduğu ve/veya kendisine tahsis edilen kurum bilişim kaynağı üzerinde bulundurduğu her türlü içerikten (belge, doküman, yazılım vb.) sorumludur.
                                </p>
                                <p>
                                    2.17. Personel, 5651 sayılı kanun gereği tutulması gereken kayıtlara ilave olarak; Kurum tarafından uygun görülen diğer sistemlerin, uygulamaların, kullanıcı işlemlerinin, bilgi sistem ağındaki verilerin ve veri akışının iz kayıtlarının hukuki ve idari süreçlere kaynak teşkil etmesi ve sistemlerin güvenli bir şekilde işletilmesi amacıyla tutulabileceğini peşinen kabul eder.
                                </p>
                                <p>
                                    2.18. Kurum tarafından kişilere kurumsal kullanım için tahsis edilen kurumsal ve tüzel e posta hesapları, sadece görevle ilgili kurumsal faaliyetler için kullanılır. Yürütülecek adli ve idari soruşturmalar kapsamında olmak şartıyla, söz konusu e-posta hesapları, personele ayrıca herhangi bir bilgilendirme yapılmaksızın, kontrol edilebilir. Personel, kendi hesabı kullanılarak gönderilen tüm e-postalardan kişisel olarak sorumludur.
                                </p>
                                <p>
                                    2.19. Kuruma ait gizli kalması gereken bilgiler, veri aktarımı vb. maksatlarla, geçici süre için olsa dahi, Kurum kontrolünde olmayan depolama alanlarında (Örn: Google Drive, iCloud, Yandex Disk, We Transfer, Rapid Share vb.) bulundurulamaz. Bu bilgiler mobil uygulamalar (Örn: WhatsApp, Massenger, Line, Viber, Telegram, WeChat, Skype, SnapChat vb.) ve sosyal medya platformları (Örn: Facebook, Youtube, Instagram, Twitter, Linkedin vb.) üzerinde işlenemez. Personelin Kurum dışı şahsi e-posta hesapları üzerinden aktarılamaz.
                                </p>
                                <p>
                                    2.20. Personel, sosyal medya hesaplarını kullanırken görevinin gerektirdiği dikkat ve özeni gösterir. Kurumları ve kişileri zor durumda bırakabilecek paylaşımların yapılmasından kaçınılır.
                                </p>
                                <p>
                                    2.21. Kişinin kendi kusuru nedeniyle parolasının ifşa olması durumunda, başkası tarafından yapılmış olsa dahi, personele teslim edilen kullanıcı adı ve parolalar ile yapılan iş ve işlemlerden şahsen sorumludur.
                                </p>
                                <p>
                                    2.22. Bilgi güvenliği ihlal olayları 24 saatten geç olmamak üzere en kısa sürede hemen bir üst amire yazılı yollarla bildirilir. Bildirimin geç yapılması nedeniyle veri koruma mevzuatında öngörülen 72 saatlik süreye riayet edilememesi durumunda personelin idari sorumluluğu doğar.
                                </p>
                                <p>
                                    2.23. İşbu sözleşme iki nüsha olarak imzalanır, bir nüshası Kurum Personel Biriminde saklanır. Diğer nüshası ise personelin kendisine verilir.
                                </p>
                                <p>
                                    2.24. Kurumda görev yapan Personel, çalışma süresi sona erdiğinde ya da kurumdan ilişiği herhangi bir gerekçeyle kesildiğinde, kendisine Kurum görevi kapsamında verilen erişim yetkilerinin kaldırılması talebinde yazılı olarak bulunur ve kendisine teslim edilen donanımları ilgili birime iade eder.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">3. YAPTIRIMLAR:</h6>
                                <p>
                                    3.1. Yukarıda sayılan kurallardan biri ya da birkaçının ihlâlinin tespit edilmesi halinde, güvenlik ihlâline yol açan personel hakkında işlem başlatılır.
                                </p>
                                <p>
                                    3.2. Yapılan ihlalin ilgili kanunlar gereği suç ve ceza öngören bir fiil olması halinde, personel hakkında suç duyurusunda bulunulur.
                                </p>
                                <p>
                                    3.3. Ayrıca ihtiyaç duyulması halinde, yapılan ihlalin 3.2 maddesinde belirtildiği şekilde suç olup olmadığına bakılmaksızın idari bir tedbir olarak;
                                </p>
                                <p>
                                    3.3.1. 657 Sayılı Devlet Memurları Kanunu’na tabi olanlar için aynı kanunun 125 maddesinde sayılan hükümlere göre,
                                </p>
                                <p>
                                    3.3.2. 657 Sayılı Devlet Memurları Kanunu’nun dışında kalan çalışanlar ile ilgili olarak (danışmanlar, firma personeli vb.) sözleşmelerinde belirtilen özel hükümlere göre, yoksa genel hükümlere göre idari işlem tesis edilir.
                                </p>
                                <p className="font-weight-bold text-dark mt-3">
                                    Yukarıda sıralanan yükümlülüklere uygun davranacağımı, bu yükümlülüklerden bir veya birkaçına herhangi bir şekilde uygun davranmamam halinde, doğabilecek idari, mali, hukuki ve cezai yaptırımların uygulanabileceğini kabul ve beyan ederim.
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
                                <strong className="text-secondary">Kartezya Technology - Rüşvet ve Yolsuzlukla Mücadele Politikası</strong>
                            </div>
                            <div 
                                ref={scrollRef3}
                                onScroll={() => handleScroll(3, scrollRef3)}
                                className="p-3 overflow-auto" 
                                style={{ maxHeight: '300px', fontSize: '0.85rem', lineHeight: '1.6', color: '#4a4a4a' }}
                            >
                                <h6 className="text-center font-weight-bold mb-3">KARTEZYA TECHNOLOGY - RÜŞVET VE YOLSUZLUKLA MÜCADELE POLİTİKASI</h6>
                                
                                <h6 className="font-weight-bold mt-3 mb-2 text-secondary">MADDE 1. AMAÇ</h6>
                                <p>
                                    1.1. Bu politika, Şirketimiz'in rüşvet ve yolsuzluk konusundaki yaklaşımının açık bir şekilde belirtilmesini amaçlamaktır. Şirketimiz olarak, bu politika ile rüşvet ve yolsuzluk karşıtı yasa ve düzenlemelere, faaliyet gösterilen ülkelerdeki yasal düzenlemelere ve etik ilkelere uyulması, bu konudaki sorumlulukların ve kuralların belirlenmesi hedeflenmektedir.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 2. İLKELER</h6>
                                <p>
                                    2.1. Etik değerler; adalet, hakkaniyet, dürüstlük, tarafsızlık ve sorumluluktur. Bu değerler Şirketimizin en temel ilkelerini oluşturur. Şirketimiz, ortaklarıyla, çalışanlarıyla, iş yaptığı tüm kuruluşlarla ve topluma karşı etik bir şekilde hareket eder ve ahlaki dayanaklarla faaliyetlerini sürdürür.
                                </p>
                                <p>
                                    a. Şirketimiz PACI ilkelerine* (Dünya Ekonomik Forumu– Yolsuzluk Karşıtı Ortaklık İnisiyatifi) uyarak rüşvet ve yolsuzluk hakkında "sıfır hoşgörü" politikasını benimseyerek uygular. Çalışanlar çıkar çatışması olmaksızın Şirketimizin yararını en iyi şekilde gözetir.
                                </p>
                                <p>
                                    b. Şirketimiz iş birliği yapılan kurum ve kuruluşlarla saygı ve güven çerçevesindeki ilişkilerin devamlılığını sağlayan iletişim stratejileri ve politikaları oluşturur. Çalışanlarının şirket temsilcileri olarak kurum içi ve dışında etik, dürüst, şeffaf, devamlı ve hesap verilebilirlik ilkeleri ışığında davranmaları gerekir. Kurumlardan da şirketimizin etik değerlerine uygun davranmalarını beklenir.
                                </p>
                                <p>
                                    c. Şirketimiz faaliyetlerini Türkiye Cumhuriyeti ve uluslararası yasalar ve mevzuatlarla tam uyum içinde sürdürür. Her türlü faaliyet ile ilgili yasal yükümlülükler yerine getirilirken tüm kurum ve kuruluşlara menfaat beklentisi olmaksızın tarafsız ve eşit mesafede durur.
                                </p>
                                <p>
                                    d. Şirketimiz sürdürülebilir kalkınmanın gerçekleşmesi için, ekonomik büyüme ve refah seviyesini yükseltme çabalarının, çevreyi ve toplumun yaşam kalitesini koruyarak gerçekleştirilmesi gerekliliğinin bilincindedir. Şirketimiz, ekonomik olarak iş sürekliliği sağlamanın yanı sıra, iş ve iş gücü uygulamalarında çalışan mutluluğu, topluma katkı, insan sağlığı ve ekolojik çevreyi düşünerek hareket etmekle sorumludur.
                                </p>
                                <p>
                                    e. Şirketimiz çalışanlarının özlük hakları tam ve doğru biçimde sağlanır. Çalışanlara adil, ayrımcı olmayan, güvenli ve sağlıklı bir çalışma ortamı sunar.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 3. KAPSAM</h6>
                                <p>
                                    3.1. İş bu Rüşvet ve Yolsuzlukla Mücadele Politikamız;
                                </p>
                                <ul>
                                    <li>a. Şirketimiz Yönetim Kurulu üyeleri,</li>
                                    <li>b. Şirketimiz yöneticileri, temsilcileri, danışmanları, işçi, personel ve çalışanları,</li>
                                    <li>c. Bağlı ortaklık ve iştiraklerimizi ve çalışanlarını,</li>
                                    <li>d. Dış hizmet aldığımız firmaları, ve</li>
                                    <li>e. Danışmanlar, avukatlar, dış denetçiler de dahil olmak üzere Şirketimiz adına görev yapan kişi ve kuruluşları (iş ortakları)</li>
                                </ul>
                                <p>kapsamaktadır.</p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 4. TANIM ve KISALTMALAR</h6>
                                <p>
                                    4.1. Bu bölümde politikada geçen özel terim ve deyimler, kavramlar, kısaltmalar aşağıdaki şekilde kısaca açıklanmaktadır.
                                </p>
                                <p>
                                    <strong>Çalışan:</strong> Şirketimiz işçi ve personelini ifade eder.
                                </p>
                                <p>
                                    <strong>Hizmet Sağlayıcısı:</strong> Şirketimizin hizmet aldığı ve/veya verdiği şirket (tedarikçi, taşeron, müşteri vb.) personelini ifade eder.
                                </p>
                                <p>
                                    <strong>Yolsuzluk:</strong> Bulunulan konum nedeniyle sahip olunan görev veya yetkinin doğrudan veya dolaylı olarak kazanç sağlama amacıyla kötüye kullanılmasıdır.
                                </p>
                                <p>
                                    <strong>Rüşvet:</strong> Bir kişinin, bir işi yapması, yapmaması, hızlandırması, yavaşlatması gibi yollarla görevinin gereklerine aykırı davranması için varılan anlaşma çerçevesinde yarar sağlanmasıdır.
                                </p>
                                <p>
                                    <strong>Kamu Görevlisi:</strong> Türk Ceza Kanunu'nda yer aldığı şekliyle kamusal faaliyetin yürütülmesine atama veya seçilme yoluyla ya da herhangi bir surette sürekli, süreli veya geçici olarak katılan kişileri kapsamaktadır. "Kamu" ise Devletin halk hizmeti gören tüm organları anlamına gelmektedir.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 5. ROL ve SORUMLULUKLAR</h6>
                                <p><strong>5.1. Yönetim Kurulu</strong></p>
                                <p>
                                    5.1.1. Yönetim Kurulu, Politika'ya, kural ve düzenlemelere uyulmaması durumunda bildirim, inceleme ve yaptırım mekanizmalarının belirlenmesi ve işletilmesinin üst gözetiminden sorumludur.
                                </p>
                                <p><strong>5.2. Denetimden Sorumlu Komite</strong></p>
                                <p>
                                    5.2.1. Denetimden Sorumlu Komite'nin görev ve sorumlulukları, ilgili yasal düzenlemelerle uyumlu şekilde, yazılı hale getirilerek Yönetim Kurulu'nca onaylanmıştır.
                                </p>
                                <p>
                                    a. Yönetim Kurulu'nun denetim ve gözetim faaliyetlerini yerine getirmesinde yardımcı olunması,
                                </p>
                                <p>
                                    b. Muhasebe ve raporlama sistemi ile iç kontrol sistemi işleyişinin ve etkinliğinin gözetilmesi,
                                </p>
                                <p>
                                    c. Destek hizmeti alınan firmalara ilişkin risk değerlendirmesi yapılması ve bu firmaların yeterliliğinin izlenmesi ve gerektiğinde denetiminin yapılması
                                </p>
                                <p>ile sorumludur.</p>
                                <p>
                                    5.2.2. Politikanın ihlal edilmesi durumunda çalışanlarımız bildirimlerini ilgili Bölüm Yöneticisi'ne ve/veya Yönetim Kurulu'na yapmak ile yükümlüdürler. Bildirim yapılan makamlar konunun değerlendirilmesi/araştırılması için Denetimden Sorumlu Komite'ye bilgi verir.
                                </p>
                                <p><strong>5.3. Şirketimiz Çalışanları</strong></p>
                                <p>5.3.1. Şirketimiz çalışanları,</p>
                                <p>
                                    a. Yönetim Kurulu'nca belirlenen politikalara uyum sağlanması,
                                </p>
                                <p>
                                    b. İç ve dış mevzuata uyumlu çalışılması, ve
                                </p>
                                <p>
                                    c. Politika'ya aykırı bir davranış, faaliyet ya da uygulama ile karşılaşılması durumunda Denetimden Sorumlu Komite'ye bildirim yapılması
                                </p>
                                <p>ile sorumludur.</p>
                                <p><strong>5.4. Dış Hizmet Alınan Firmalar ve İş Ortakları</strong></p>
                                <p>
                                    5.4.1. Destek hizmetleri de dahil olmak üzere dış hizmet alınan firmaların ve iş ortaklarının, Politika esaslarına ve ilgili diğer düzenlemelere uyum sağlaması zorunludur ve bunlara uymayan kişi ve kuruluşlar ile çalışmalar sonlandırılır.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 6. UYGULAMA ESASLARI</h6>
                                <p><strong>6.1. Rüşvet ve Yolsuzluk</strong></p>
                                <p>
                                    6.1.1. Şirketimiz, iş etiği konusunda gösterdiği hassasiyetlerin bir göstergesi olarak, rüşvet ve yolsuzlukla mücadele politikası düzenlemiştir. Rüşvet ve yolsuzluk pek çok farklı şekilde gerçekleştirilebilir, bunlar arasında:
                                </p>
                                <ul>
                                    <li>a. Nakit ödemeler, Siyasi ya da diğer bağışlar,</li>
                                    <li>b. Komisyon,</li>
                                    <li>c. Kolaylaştırıcı ödemeler,</li>
                                    <li>d. Sosyal haklar,</li>
                                    <li>e. Etik İlke ve Davranış Kuralları'nda tanımlanan şekil harici hediye, temsil ve ağırlamalar,</li>
                                    <li>f. İşe yakınının alınması,</li>
                                    <li>g. Diğer menfaatler, ve</li>
                                    <li>h. Terfi</li>
                                </ul>
                                <p>gibi sayılabilir.</p>
                                <p>
                                    6.1.2. İşbu Politika'da belirlenen ilkeler kapsamında, faaliyetlerimizi adil, şeffaf, dürüst, yasal ve etik kurallara uygun bir şekilde sürdürmeyi taahhüt etmekteyiz.
                                </p>
                                <p>
                                    6.1.3. Rüşvet ve yolsuzlukla mücadele konusunda son derece hassas olmakla birlikte, rüşvet ve yolsuzluğun karşısındayız, rüşvet ve yolsuzluk içeren faaliyetleri tolere etmeyiz. Bu bakımdan, Rüşvet'in teklif edilmesi, ima edilmesi, alınması veya verilmesi kabul edilemez.
                                </p>
                                <p>
                                    6.1.4. Rüşvet aracılığıyla, Şirketimiz ile çalışmak isteyen üçüncü taraflarla iş ilişkisinin devam ettirilmemesine prensip olarak benimsemekteyiz.
                                </p>
                                <p>
                                    6.1.5. Çalışanlarımız, rüşvet vermeyi veya almayı reddetmesinden doğacak gecikme veya kazanç kaybı için cezalandırılmaz.
                                </p>
                                <p>
                                    6.1.6. Rüşvet ve yolsuzlukla mücadele ile ilgili yerel ve faaliyette bulunulan ülkelerdeki yasa, düzenlemelere ve ilkelere uyum sağlarız. Faaliyet kapsamında yer aldığımız sektörlerde, rüşvete ve yolsuzluğa karşı düzenlenmiş olan OECD (Ekonomik Kalkınma ve İşbirliği Örgütü) Uluslararası Ticari İşlemlerde Yabancı Kamu Görevlilerine Rüşvet Verilmesinin Önlenmesi Sözleşmesi'ne, Amerika Birleşik Devletleri'nde geçerli düzenlemelere, Avrupa Birliği'nde geçerli düzenlemelere ve diğer rüşvet ve yolsuzluk karşıtı yasal düzenlemelere uyarız.
                                </p>
                                <p><strong>6.2. Kamu ile İlişkiler</strong></p>
                                <p>
                                    6.2.1. Resmi bir eylem veya kararı etkileme amaçlı, Kamu Görevlisi' ne değerli herhangi bir hediye ve/veya şey vermeyi, dolaylı veya doğrudan her türlü ödeme yapmayı taahhüt etmek veya ima etmek kabul edilemez.
                                </p>
                                <p>
                                    6.2.2. Bunun yanı sıra çalışanlarımız, kamusal işlerde menfaat sağlamak adına, kamu görevlilerine dolaylı veya dolaysız şekilde rüşvet veremezler. Bu sebeple çalışanlarımız, Şirketimizin Rüşvet ve Yolsuzlukla Müalede Politikası'na uygun olarak davranmakla yükümlüdürler.
                                </p>
                                <p><strong>6.3. Anlaşma ve İhaleler</strong></p>
                                <p>
                                    6.3.1. Şirketimiz olarak, dahil olduğumuz anlaşmalarda, bir iş ilişkisinin başlatılması ya da devam etmesi durumunda ve kamu veya kamu dışındaki ihalelerde bu politikaya uyumlu davranmaya özen gösteririz. Bunun yanı sıra, Şirketimiz olarak, şirket birleşme ve satın alma işlemleri ile ortak girişim süreçlerinde bu politikaya uygun davranmayı ve bu süreçlerde hedef olan şirketlerin veya birlikte çalışılan şirketlerin de bu politikaya uyumlu hareket etmesini bekleriz.
                                </p>
                                <p><strong>6.4. Kolaylaştırma Ödemeleri</strong></p>
                                <p>
                                    6.4.1. Şirketimiz olarak, kamu kurumları ile rutin bir işlemi ya da bir süreci (izin, ruhsat almak, ihale işlemleri gibi) güvenceye almak ya da hızlandırmak için kolaylaştırıcı ödemelere izin vermeyiz.
                                </p>
                                <p><strong>6.5. Bağış ve Hediye</strong></p>
                                <p>
                                    6.5.1. Şirketimizin bağış ve hediyelere ilişkin konuları ve bunların kayıt altına alınması ile ilgili esaslar, aşağıda yer alan Etik İlke ve Davranış Kuralları'nda ayrıntılı olarak düzenlenmiştir.
                                </p>
                                <p>
                                    6.5.2. Çalışanlarımız kamu çalışanları, müşteriler, tedarikçiler ve diğer iş ortakları ile olan ilişkilerinde bağımsızlıklarını zedeleyecek herhangi bir hediyeyi kabul ve teklif edemezler.
                                </p>
                                <p>
                                    6.5.3. Çıkar çatışmasına yol açabilecek veya bu şekilde algılanabilecek durumlara sebebiyet verilmemesine, böyle durumlarda hediye teklif ve kabul edilmemesine özen gösteririz.
                                </p>
                                <p><strong>6.6. Kayıtların Tutulması</strong></p>
                                <p>
                                    6.6.1. Şirketimizin muhasebe sistemi ile ilgili uymak zorunda olduğu hususlar, ilgili mevzuat ve düzenlemeler çerçevesinde düzenlenmiştir.
                                </p>
                                <ul>
                                    <li>a. Üçüncü şahıslarla (müşteriler, tedarikçiler, diğer hizmet sağlayıcıları vb.) ilişkilere ait her türlü hesap, fatura ve belgenin, eksiksiz, şeffaf, kesin, adil ve doğruluğuna güvenilir şekilde kayıt altında tutulması ve muhafaza edilmesine,</li>
                                    <li>b. Kayıt dışı işlemleri engelleyecek iç kontrol sistemlerinin kurulmasına, ve</li>
                                    <li>c. Herhangi bir işleme ilişkin muhasebe ya da benzer ticari kayıtlar üzerinde değişiklik yapılmaması ve gerçeklerin saptırılmamasına</li>
                                </ul>
                                <p>özen gösteririz.</p>
                                <p><strong>6.7. Temsil ve Ağırlama</strong></p>
                                <p>6.7.1. Temsil ve ağırlama etkinlik faaliyetleri arasında;</p>
                                <ul>
                                    <li>a. Sosyal Etkinlikler,</li>
                                    <li>b. Konaklama, ve</li>
                                    <li>c. Yemek Daveti</li>
                                </ul>
                                <p>sayılabilir.</p>
                                <p>
                                    6.7.2. Şirketimiz, ticari ilişkilerini geliştirmek, ticari iletişim ağı kurma çalışmaları için temsil ve ağırlama faaliyetleri gerçekleştirebilir.
                                </p>
                                <p>
                                    6.7.3. Bu etkinlik faaliyetlerinin makul ölçüde olmasına gayret ederiz. Temsil ve ağırlamanın, temel ve önemli bir kararı alma süreci öncesinde olmamasına özen gösteririz.
                                </p>
                                <p><strong>6.8. Eğitim ve İletişim</strong></p>
                                <p>
                                    6.8.1. Rüşvet ve Yolsuzlukla Mücadele Politikamız, Şirketimiz çalışanlarına duyurulmuştur ve kurumun portalı aracılığıyla da sürekli ve kolaylıkla erişilebilir durumdadır.
                                </p>
                                <p>
                                    6.8.2. Çalışanlarımızın rüşvet ve yolsuzluk karşıtlığı konusunda bilinçlendirilmesi adına eğitimler düzenlenir.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 7. ETİK İLKE VE DAVRANIŞ KURALLARI</h6>
                                <p>
                                    7.1. Etik kuralları, şirketimiz çalışanlarının, görevlerini yerine getirirken uymaları gereken ilkeleri ve çalışma düzenine ilişkin ilkeleri içermektedir. Bu ilkelerin amacı; uyulması gereken temel kuralların çerçevesini çizmek ve çalışanlar, iş ortakları, müşteriler ve kurumumuz arasında doğabilecek her türlü anlaşmazlık ve çıkar çatışmasını engellemektir.
                                </p>
                                <p>
                                    7.2. Çıkar çatışmaları ve bunların yönetimi konusundaki temel prensiplere aşağıda yer verilmiştir.
                                </p>
                                <p>
                                    a. Çalışanlarımız kurumdaki görev ve yetkilerini hiçbir şekilde kişisel ve özel çıkar sağlamak üzere kendilerinin, ailelerinin veya üçüncü kişilerin yararına kullanamazlar.
                                </p>
                                <p>
                                    b. Çalışanlarımız, şirket işleri ile ilgili doğrudan veya dolaylı hediye kabul edemez, menfaat sağlayamaz ve şirketin iş ilişkisinde olduğu kişi veya firmalardan borç kabul edemez.
                                </p>
                                <p>
                                    c. Çalışanlarımız, üçüncü kişilere ve kuruluşlara, tarafsızlıklarını, karar ve davranışlarını etkileyecek hediyeler veremez, menfaatler sağlayamaz.
                                </p>
                                <p>
                                    d. Şirketin kaynakları ve olanakları, siyasi faaliyetleri desteklemek amacıyla kullanılamaz, şirket dâhilinde siyasi faaliyet yürütülemez, siyasi partilere veya adaylarına bağış yapılamaz ve siyasi kampanyalara destek verilemez.
                                </p>
                                <p>
                                    7.3. Yukarıda sayılan maddelere dair detaylar aşağıda sunulmuştur.
                                </p>
                                <p><strong>7.4. Verilebilecek Hediyeler</strong></p>
                                <p>
                                    7.4.1. İş ilişkisi içerisinde olunan taraflara verilecek hediyelerin, bu dokümanda belirtilen kurallara uygun olduğundan emin olunmalıdır. Bu doğrultuda verilecek hediyeler için aşağıdaki kurallar belirlenmiştir.
                                </p>
                                <p>
                                    7.4.2. Bu konudaki temel kural, herhangi bir miktarda parasal ödeme veya paraya kolay çevrilebilir hediye verilmemesidir. Ancak gelenek ve göreneklerimize uygun bir şekilde, özel veya genel kutlamalar nedeniyle (düğün, nişan, doğum günü gibi) çalışanlarımızın statü ve konumuna uygun biçimde verebileceği hediyeler bu kapsam dışındadır.
                                </p>
                                <p>
                                    7.4.3. Verilen hediyenin değeri, 1.000 (bin Türk Lirası) Türk Lirası'nın üzerinde olamaz. İstisnai durumlar için Bölümün en üst Yöneticisinin onayı gerekir.
                                </p>
                                <p>
                                    7.4.4. Verilen hediyelerin, kurumun içinde yer aldığı herhangi bir iş, anlaşma, bürokratik işlem ile ilgili karşı tarafın tarafsızlığını, karar ve davranışını etkileme amacını taşımaması gerekmektedir.
                                </p>
                                <p><strong>7.5. Kabul Edilebilecek Hediyeler</strong></p>
                                <p>
                                    7.5.1. Çalışanlarımız, kurum ile iş yapan üçüncü Kişilerden hiçbir şekilde kişisel bir ödeme veya hediye talep ve bu anlamı doğuran davranışlarda bulunamazlar. Dürüstlük ve iyi niyet anlayışı çerçevesinde kalmak kaydıyla hediyelerin kabulü ancak aşağıdaki kurallar çerçevesinde söz konusu olabilir.
                                </p>
                                <p>
                                    7.5.2. Çalışanlarımız hiçbir şekilde ve miktarda parasal ödeme kabul edemez. Paraya kolay çevrilebilen (hediye çeki v.s.) araçlar da buna dahildir.
                                </p>
                                <p>
                                    7.5.3. Parasal ödeme şeklinde olmayan hediyelerin değeri 1.000 (bin Türk Lirası) Türk Lirası'nı aşmamak ve kurumu ilgilendiren hiçbir iş ve anlaşmayla bağlantılı olmamak ve çalışanlarımızı bu konularda etkilemek için verilmediği açık olmak kaydıyla kabul edilebilir.
                                </p>
                                <p>
                                    7.5.4. Değeri 10.000 (on bin Türk Lirası) Türk Lirası'nı aşan nakit dışı hediye teklifi veya sunumları ile karşılaşılması durumunda, çalışanın söz konusu teklifi kabul etmemesi esastır. Ancak istisnai olarak, çıkar çatışmasına yol açmayacak şekilde ve bir sebeple sunulan hediye teklifiyle karşılaşılması durumunda, Yönetimin yazılı onayıyla bu tür hediyelerin kabulü de söz konusu olabilir. Yazılı onaylar, çalışılan bölümün en üst yöneticisinden alınır. Hediyenin kabul edilebileceğine dair alınan onaylar, izni alan tarafta muhafaza edilmelidir.
                                </p>
                                <p><strong>7.6. Kamu Görevlilerine Verilecek Hediyeler</strong></p>
                                <p>
                                    7.6.1. Herhangi bir Kamu Görevlisine veya çalışanına hediye verilmek istendiğinde, resmi bir kuruluş olan Etik Kurulu'nun http://www.etik.gov.tr web adresinde yer alan bu konudaki güncel kararına uygun hareket edilmelidir.
                                </p>
                                <p><strong>7.7. İş Yemekleri</strong></p>
                                <p>
                                    7.7.1. Yemek davetinde bulunulması ya da katılınmasında davetin amacına uygun olmasına dikkat edilmelidir. Prensip olarak iş yemeği olarak yapılan bir davetin iş yemeği konseptine ve katılımcıların konumuna uygun bir yerde olması esastır.
                                </p>
                                <p><strong>7.8. Siyasi İçerikli Faaliyetler</strong></p>
                                <p>
                                    7.8.1. Şirketimiz çalışanlarının siyasal etkinliklere bireysel olarak katılma hakkına saygı gösterir ancak siyasal etkinliklere katılanlar, şirketi temsil etmediklerini açıklıkla ortaya koymalıdırlar. Siyasal etkinliklerde yer alan çalışanlarımızdan aşağıdakiler beklenmektedir:
                                </p>
                                <p>
                                    a. Hiçbir şekilde Şirketi temsil etmiyor olduğu gerçeğini açıkça ortaya koymak, ve
                                </p>
                                <p>
                                    b. Kişisel siyasal etkinlikleri yerine getirmede ya da desteklemede Şirket kaynaklarının kullanımından (Şirket süresi, telefonlar, kağıt, e-posta ve diğer varlıklar dahil olmak üzere) kesinlikle kaçınmak.
                                </p>
                                <p><strong>7.9. Ek İş</strong></p>
                                <p>
                                    7.9.1. Şirketimiz çalışanları gerek iş günlerinde, hafta tatilinde, ulusal bayram ve genel tatil günlerinde ve gerekse de yıllık ücretli izin günlerinde ücret karşılığı ikinci bir işte çalışamazlar. Kültür, sanat veya bilimsel çalışmalar suretiyle telif hakkı karşılığı yapılan çalışmalar için İnsan Kaynakları Bölümü'ne bilgi verilir. Ayrıca Çalışanlarımız, kendilerine ücret ödenmesini gerektirecek danışmanlık veya benzeri bir pozisyon teklifi söz konusu olduğunda ya da bir şirkette, yönetiminde söz sahibi olacak düzeyde doğrudan veya dolaylı pay sahibi olması halinde İcra Kurulu Başkanı'nın yazılı onayını almalıdırlar.
                                </p>
                                <p>
                                    7.9.2. Öte yandan, çalışanlarımız kurumdaki görev ve sorumluluklarını aksatmayacak şekilde gönüllü (kanuni yollarla kurulmuş yardım kuruluşları, dernekler veya sivil toplum örgütleri gibi) faaliyetlerde bulunabilirler. Ancak bu faaliyet sırasında Şirketimizin Kurumsal unvanı ve çalışanın Şirketimizdeki konumu kullanılamaz.
                                </p>
                                <p><strong>7.10. Kişisel Yatırımlar</strong></p>
                                <p>
                                    7.10.1. Çalışanlarımız kişisel yatırımlarını yönlendirirken, kurumdaki görev ve sorumlulukları ile olası herhangi bir çıkar çatışması yaratacak firmaların payları veya diğer yatırım araçları ile kişisel yatırım yapamazlar.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 8. İHBAR VE BİLDİRİM</h6>
                                <p>
                                    8.1. Çalışanlarımız ihbar ve bildirimlerini İnsan Kaynakları görevini yürüten Şirket personeline yazılı veya sözlü olarak bildirebilirler. Ayrıca çalışanlarımız iş bu Politika metni ile alakalı soru ve görüşlerini İnsan Kaynakları görevini yürüten Şirket personeline serbestçe iletebilirler.
                                </p>
                                <p>
                                    8.2. Şirket Çalışanlarının, İş Ortaklarının ve Şirketimiz dışındaki diğer tüm tarafların şirket ile ilgili yaşanmış ve yaşanması muhtemel çıkar çatışmaları, Politika ihlalleri ve yasalara aykırı uygulamalar konularındaki şikayet ve bildirimlerini gizlilik içerisinde ve güvenli bir şekilde yapabileceği <strong>0542 821 88 89</strong> numaralı bir "Bildirim Hattı" (Hotline) kullanıyoruz.
                                </p>
                                <p>
                                    8.3. Tüm çalışanlarımız, iş ortaklarımız ve yöneticilerimiz, gizlilik içerisinde ihbarlarını doğrudan bu kanal üzerinden ilgili birimlere yönlendirebilirler.
                                </p>
                                <p>
                                    8.4. Çalışanlarımız ihbar ve bildirimlerini doğrudan Denetim Komitesi'ne bildirebilirler.
                                </p>

                                <h6 className="font-weight-bold mt-4 mb-2 text-secondary">MADDE 9. YAPTIRIM VE CEZALAR</h6>
                                <p>
                                    9.1. Şirketimiz, iş bu Politika'ya uyulmaması halinde, her türlü zarara ilişkin tazmin hakkı saklı kalmak üzere:
                                </p>
                                <p>
                                    a. Uygun davranmayan çalışanından savunma almaya, soruşturma başlatmaya, iş sözleşmesini askıya almaya, iş sözleşmesini feshetmeye ve İş Kanunu ve yürürlükteki mevzuat uyarınca haklarını kullanma hak ve yetkisine sahiptir.
                                </p>
                                <p>
                                    b. Uygun davranmayan danışman, avukat ve finansal uzmanlarından hizmet almayı durdurma ve hizmet sözleşmelerini sona erdirme hakkına sahiptir.
                                </p>
                                <p>
                                    c. Uygun davranmayan iş ortakları ile arasındaki ticari iş ilişkilerini durdurma, askıya alma ve sona erdirme hak ve yetkisine sahiptir.
                                </p>
                                <p>
                                    9.2. Şirketimizin ayrıca kamu otoritelerine ihbar ve bildirimde bulunma hakkı saklıdır.
                                </p>
                                <p className="font-weight-bold text-dark mt-3">
                                    İşbu Rüşvet ve Yolsuzlukla Mücadele Politikası 10.07.2026 tarihinde imza edilerek yürürlüğe konmuştur. İş bu Rüşvet ve Yolsuzlukla Mücadele Politikası yeni bir duyuru yapılana kadar geçerli ve yürürlükte kalacaktır.
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
                                    <strong>Fotoğraf ve Video Paylaşımı Açık Rıza Beyanı</strong>
                                </p>
                                <p className="mb-2">
                                    <strong>Kartezya Bilişim Danışmanlık ve Teknoloji Hizmetleri Ltd. Şti. ("Şirket")</strong> bünyesinde düzenlenen kurum içi etkinlikler, kutlamalar, toplantılar, eğitimler ve ofis içi günlük faaliyetler sırasında çekilmiş olan fotoğraflarımın ve video kayıtlarımın;
                                </p>
                                <p className="mb-2">
                                    Kurumsal iletişimin sağlanması, Şirket içi motivasyonun artırılması ve Şirket'in kurumsal itibar yönetimi amaçlarıyla Şirket'e ait resmi kurumsal sosyal medya hesaplarında (LinkedIn, Instagram vb.), Şirket internet sitesinde ve kurum içi iletişim portallarında paylaşılmasına;
                                </p>
                                <p className="mb-3 font-weight-bold text-dark">
                                    Konuyla ilgili tarafıma sunulan Personel Aydınlatma Metni'ni okuduğumu, haklarımı anladığımı ve vermiş olduğum bu onayı dilediğim zaman geri çekme hakkım olduğunu bilerek, hiçbir baskı altında kalmadan özgür irademle AÇIK RIZA VERİYORUM / ONAYLIYORUM.
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
