# Searchable Select Components - Kullanım Kılavuzu

Bu kılavuz, projedeki **searchable (aranabilir)** select ve multi-select bileşenlerinin nasıl kullanılacağını açıklar.

## Bileşenler

### 1. **MultiSelectField** - Aranabilir Çoklu Seçim

Birden fazla seçenek seçmenizi sağlar. Dropdown açıldığında otomatik olarak üstte bir arama kutusu görünür.

#### Özellikler

- ✅ **Anlık Arama**: Dropdown açıldığında otomatik focus olan arama kutusu
- ✅ **Filtreleme**: Kullanıcı yazdıkça liste anlık olarak filtrelenir
- ✅ **Checkbox Gösterimi**: Seçili öğeler checkbox ile işaretli
- ✅ **Chip/Tag Gösterimi**: Seçili öğeler küçük badge'ler olarak gösterilir
- ✅ **Responsive**: Mobilde alt bottom sheet, desktop'ta dropdown
- ✅ **"X seçildi" Özeti**: Tek seçimde isim, çoklu seçimde sayı gösterir

#### Kullanım Örneği

```tsx
import MultiSelectField from "@/components/MultiSelectField";

function MyForm() {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  const departmentOptions = [
    { value: "1", label: "İnsan Kaynakları" },
    { value: "2", label: "Yazılım Geliştirme" },
    { value: "3", label: "Pazarlama" },
    { value: "4", label: "Satış" },
    { value: "5", label: "Finans" },
    // ... daha fazla seçenek
  ];

  return (
    <MultiSelectField
      name="departments"
      value={selectedDepartments}
      onChange={setSelectedDepartments}
      options={departmentOptions}
      placeholder="Departman seçiniz"
      disabled={false}
      loading={false}
    />
  );
}
```

#### Props

| Prop | Tip | Zorunlu | Varsayılan | Açıklama |
|------|-----|---------|-----------|----------|
| `name` | `string` | ✅ | - | Input adı |
| `value` | `string[]` | ✅ | - | Seçili değerler (array) |
| `onChange` | `(values: string[]) => void` | ✅ | - | Değer değişim callback'i |
| `options` | `Option[]` | ✅ | - | Seçenekler listesi |
| `placeholder` | `string` | ❌ | "Seçiniz" | Placeholder metni |
| `disabled` | `boolean` | ❌ | `false` | Devre dışı durumu |
| `loading` | `boolean` | ❌ | `false` | Yükleniyor durumu |

#### Option Tipi

```tsx
interface Option {
  value: string;
  label: string;
}
```

---

### 2. **FormSelectField** - Aranabilir Tekli Seçim (Form Uyumlu)

Form yapısıyla uyumlu, tek seçim yapılabilen select bileşeni. Bootstrap Form.Group ile entegre.

#### Özellikler

- ✅ **Anlık Arama**: Dropdown açıldığında otomatik focus olan arama kutusu
- ✅ **Filtreleme**: Kullanıcı yazdıkça liste anlık olarak filtrelenir
- ✅ **Checkmark Gösterimi**: Seçili öğe işaretli (✓)
- ✅ **Form Validation**: isInvalid ve errorMessage desteği
- ✅ **Form.Group Entegrasyonu**: Label, Col, controlId desteği
- ✅ **Responsive**: Mobilde bottom sheet, desktop'ta dropdown

#### Kullanım Örneği

```tsx
import FormSelectField from "@/components/FormSelectField";
import { Col } from "react-bootstrap";

function MyForm() {
  const [formData, setFormData] = useState({
    department: ""
  });
  
  const [errors, setErrors] = useState({
    department: ""
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <FormSelectField
      as={Col}
      md={6}
      controlId="department"
      label="Departman"
      name="department"
      value={formData.department}
      onChange={handleSelectChange}
      isInvalid={!!errors.department}
      errorMessage={errors.department}
    >
      <option value="">Seçiniz</option>
      <option value="1">İnsan Kaynakları</option>
      <option value="2">Yazılım Geliştirme</option>
      <option value="3">Pazarlama</option>
      <option value="4">Satış</option>
      <option value="5">Finans</option>
      {/* ... daha fazla seçenek */}
    </FormSelectField>
  );
}
```

#### Props

| Prop | Tip | Zorunlu | Varsayılan | Açıklama |
|------|-----|---------|-----------|----------|
| `name` | `string` | ✅ | - | Input adı |
| `value` | `string` | ✅ | - | Seçili değer |
| `onChange` | `(e: React.ChangeEvent<HTMLSelectElement>) => void` | ✅ | - | Değer değişim callback'i |
| `children` | `React.ReactNode` | ✅ | - | `<option>` elementleri |
| `as` | `typeof Col` | ❌ | - | Bootstrap Col component |
| `md` | `number` | ❌ | - | Bootstrap grid boyutu |
| `controlId` | `string` | ❌ | - | Form kontrolü ID |
| `label` | `string` | ❌ | - | Label metni |
| `disabled` | `boolean` | ❌ | `false` | Devre dışı durumu |
| `isInvalid` | `boolean` | ❌ | `false` | Validation hatası durumu |
| `errorMessage` | `string` | ❌ | - | Hata mesajı |

---

## Kullanım Senaryoları

### 1. Departman Seçimi (Multi-select)

```tsx
<MultiSelectField
  name="departments"
  value={formData.departments}
  onChange={(values) => setFormData({ ...formData, departments: values })}
  options={departmentOptions}
  placeholder="Departman seçiniz"
/>
```

### 2. Pozisyon Seçimi (Single-select)

```tsx
<FormSelectField
  label="Pozisyon"
  name="position"
  value={formData.position}
  onChange={handleChange}
>
  <option value="">Seçiniz</option>
  <option value="developer">Yazılım Geliştirici</option>
  <option value="designer">Tasarımcı</option>
  <option value="manager">Yönetici</option>
</FormSelectField>
```

### 3. API'den Gelen Verilerle Kullanım

```tsx
const [departments, setDepartments] = useState<Option[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchDepartments() {
    setLoading(true);
    const response = await api.get('/departments');
    const options = response.data.map((dept: any) => ({
      value: dept.id,
      label: dept.name
    }));
    setDepartments(options);
    setLoading(false);
  }
  fetchDepartments();
}, []);

return (
  <MultiSelectField
    name="departments"
    value={selectedDepartments}
    onChange={setSelectedDepartments}
    options={departments}
    loading={loading}
  />
);
```

---

## Yeni Özellikler (Eklenen İyileştirmeler)

### 🔍 Otomatik Arama Kutusu

- Dropdown açıldığında üstte bir arama input'u otomatik görünür
- Input otomatik focus olur (desktop'ta)
- Dropdown kapandığında arama temizlenir

### 📱 Responsive Tasarım

- **Desktop**: Dropdown olarak açılır
- **Mobile**: Alt bottom sheet olarak açılır
- Her ikisinde de arama kutusu mevcut

### ⚡ Anlık Filtreleme

- Kullanıcı yazdıkça liste anlık filtrelenir
- Hem `label` hem de `value` alanlarında arama yapar
- Büyük/küçük harf duyarsız

### 🎨 Görsel İyileştirmeler

- Smooth animasyonlar (fade in/out, slide up/down)
- Custom scrollbar styling
- Modern shadow ve border radius
- Bootstrap tema renkleriyle uyumlu

---

## Teknik Detaylar

### State Management

Her iki bileşen de kendi içinde şu state'leri yönetir:
- `isOpen`: Dropdown açık/kapalı durumu
- `searchQuery`: Arama metni
- `isMobile`: Mobil cihaz kontrolü
- `dropdownPosition`: Dropdown pozisyon hesaplamaları

### Performance

- `React.useMemo` ile filtreleme optimize edildi
- Gereksiz re-render'lar engellendi
- Portal kullanımı ile DOM performansı artırıldı

### Accessibility

- Keyboard navigation desteği
- ARIA attributes (aria-expanded, aria-haspopup, role)
- Focus management
- Screen reader uyumlu

---

## Önemli Notlar

1. **Bileşenler tamamen reusable**: Projenin herhangi bir yerinde kullanılabilir
2. **TypeScript desteği**: Full type safety
3. **Bootstrap uyumlu**: Mevcut tema ve stillerle uyumlu
4. **Performanslı**: Büyük listelerde bile hızlı çalışır
5. **Mobil uyumlu**: Touch-friendly ve responsive

---

## Güncellemeler ve İyileştirmeler

Bu bileşenler şu iyileştirmelerle güncellendi (1 Mart 2026):

✅ Dropdown üstüne arama input'u eklendi  
✅ Anlık filtreleme özelliği eklendi  
✅ Otomatik focus ve temizleme eklendi  
✅ "Sonuç bulunamadı" mesajı eklendi  
✅ Mobil ve desktop için ayrı arama UI'ları eklendi  
✅ Performance optimizasyonları yapıldı  

---

## Sorular ve Destek

Bu bileşenlerle ilgili sorularınız için projedeki diğer geliştiricilerle iletişime geçebilirsiniz.
