// Backend'den gelen hata mesajlarını Türkçe'ye çeviren fonksiyon
export const translateErrorMessage = (error: string): string => {
  const errorTranslations: { [key: string]: string } = {
    // Genel hatalar
    'Internal Server Error': 'Sunucu hatası oluştu',
    'Bad Request': 'Geçersiz istek',
    'Unauthorized': 'Yetkisiz erişim',
    'Forbidden': 'Erişim reddedildi',
    'Not Found': 'Kayıt bulunamadı',
    'Conflict': 'Kayıt zaten mevcut',
    'Validation Error': 'Doğrulama hatası',
    
    // Form validasyon hataları
    'Name is required': 'Ad alanı zorunludur',
    'Email is required': 'E-posta alanı zorunludur',
    'Phone is required': 'Telefon alanı zorunludur',
    'Title is required': 'Başlık alanı zorunludur',
    'Company is required': 'Şirket seçimi zorunludur',
    'Department is required': 'Departman seçimi zorunludur',
    
    // Backend field validation hataları
    'Field validation for \'CompanyID\' failed on the \'required\' tag': 'Şirket seçimi zorunludur',
    'Field validation for \'Name\' failed on the \'required\' tag': 'Ad alanı zorunludur',
    'Invalid request format': 'Geçersiz istek formatı',
    'Key: \'CreateDepartmentRequest.CompanyID\' Error:Field validation for \'CompanyID\' failed on the \'required\' tag': 'Şirket seçimi zorunludur',
    
    // Şirket hataları - farklı varyasyonlar
    'Company name already exists': 'Bu şirket adı zaten kullanılıyor',
    'company name already exists': 'Bu şirket adı zaten kullanılıyor',
    'Company with this name already exists': 'Bu şirket adı zaten kullanılıyor',
    'company with this name already exists': 'Bu şirket adı zaten kullanılıyor',
    'A company with this name already exists': 'Bu şirket adı zaten kullanılıyor',
    'Company already exists': 'Bu şirket zaten mevcut',
    'Company not found': 'Şirket bulunamadı',
    'Cannot delete company with employees': 'Çalışanı olan şirket silinemez',
    
    // Departman hataları - farklı varyasyonlar
    'Department name already exists': 'Bu departman adı zaten kullanılıyor',
    'department name already exists': 'Bu departman adı zaten kullanılıyor',
    'Department with this name already exists': 'Bu departman adı zaten kullanılıyor',
    'department with this name already exists': 'Bu departman adı zaten kullanılıyor',
    'Department not found': 'Departman bulunamadı',
    'Cannot delete department with employees': 'Çalışanı olan departman silinemez',
    
    // İş pozisyonu hataları - farklı varyasyonlar
    'Job position title already exists': 'Bu pozisyon adı zaten kullanılıyor',
    'job position title already exists': 'Bu pozisyon adı zaten kullanılıyor',
    'Job position with this title already exists': 'Bu pozisyon adı zaten kullanılıyor',
    'job position with this title already exists': 'Bu pozisyon adı zaten kullanılıyor',
    'Job position not found': 'İş pozisyonu bulunamadı',
    'Cannot delete job position with employees': 'Çalışanı olan pozisyon silinemez',
    
    // E-posta hataları
    'Invalid email format': 'Geçersiz e-posta formatı',
    'Email already exists': 'Bu e-posta adresi zaten kullanılıyor',
    
    // Telefon hataları
    'Invalid phone format': 'Geçersiz telefon formatı',
    'Phone already exists': 'Bu telefon numarası zaten kullanılıyor',
    
    // URL hataları
    'Invalid URL format': 'Geçersiz URL formatı',

    // Job run hataları
    'Bu görev seçilen tarih için daha önce başarıyla çalıştırılmış.': 'Bu görev seçilen tarih için daha önce başarıyla çalıştırılmış.',
    'Bu görev seçilen tarih için halen çalışıyor.': 'Bu görev seçilen tarih için halen çalışıyor.',
    'Bu görev seçilen tarih için daha önce başarıyla çalıştırılmış veya halen çalışıyor.': 'Bu görev seçilen tarih için daha önce başarıyla çalıştırılmış veya halen çalışıyor.',
    'Bu görev geçmiş tarih için çalıştırılamaz.': 'Bu görev geçmiş tarih için çalıştırılamaz.',
    'reference_date cannot be in the future': 'Referans tarihi gelecekte olamaz',
  };

  // Önce tam eşleşme ara (büyük/küçük harf duyarlı olmadan)
  const lowerError = error.toLowerCase();
  for (const [englishError, turkishError] of Object.entries(errorTranslations)) {
    if (lowerError === englishError.toLowerCase()) {
      return turkishError;
    }
  }

  // Kısmi eşleşme ara
  for (const [englishError, turkishError] of Object.entries(errorTranslations)) {
    if (lowerError.includes(englishError.toLowerCase())) {
      return turkishError;
    }
  }

  // Özel durumlar için regex tabanlı kontrol
  const specialPatterns = [
    { pattern: /company.*name.*already.*exists/i, message: 'Bu şirket adı zaten kullanılıyor' },
    { pattern: /department.*name.*already.*exists/i, message: 'Bu departman adı zaten kullanılıyor' },
    { pattern: /job.*position.*title.*already.*exists/i, message: 'Bu pozisyon adı zaten kullanılıyor' },
    { pattern: /already.*exists/i, message: 'Bu kayıt zaten mevcut' },
    { pattern: /duplicate.*entry/i, message: 'Aynı kayıt zaten mevcut' },
    { pattern: /constraint.*violation/i, message: 'Veri kısıtlama hatası' }
  ];

  for (const { pattern, message } of specialPatterns) {
    if (pattern.test(error)) {
      return message;
    }
  }

  // Eğer çeviri bulunamazsa orijinal mesajı döndür
  return error || 'Bilinmeyen bir hata oluştu';
};

// Form field validasyon hataları için
export const getFieldErrorMessage = (fieldName: string, value: string): string | null => {
  switch (fieldName) {
    case 'name':
      if (!value?.trim()) {
        return 'Bu alan zorunludur';
      }
      if (value.length < 2) {
        return 'En az 2 karakter olmalıdır';
      }
      break;
      
    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Geçerli bir e-posta adresi giriniz';
      }
      break;
      
    case 'phone':
      if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        return 'Geçerli bir telefon numarası giriniz';
      }
      break;
      
    case 'website':
      if (value && !/^https?:\/\/.+\..+/.test(value)) {
        return 'Geçerli bir website adresi giriniz (http:// veya https:// ile başlamalı)';
      }
      break;
      
    case 'title':
      if (!value?.trim()) {
        return 'Bu alan zorunludur';
      }
      if (value.length < 2) {
        return 'En az 2 karakter olmalıdır';
      }
      break;
      
    case 'companyId':
      if (!value) {
        return 'Şirket seçimi zorunludur';
      }
      break;
      
    default:
      return null;
  }
  
  return null;
};