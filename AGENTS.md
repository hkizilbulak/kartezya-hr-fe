# AGENTS.md — Kartezya HR Frontend

Araçtan bağımsız AI coding kuralları. Uzun component veya route listeleri burada değil.

## A. Proje özeti

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript
- **HTTP:** Axios (`services/`, `helpers/api/`)
- **Stil:** Bootstrap, react-bootstrap, SCSS
- **Yetkilendirme:** Capability tabanlı UI kontrolleri (`lib/authz/`)
- **Opsiyonel sunum:** Go static server (`main.go`, `build:go`)

## B. Navigasyon

- Uygulama içi geçişlerde `next/link` veya Next.js router kullan.
- Native `<a href>` ile gereksiz full page reload oluşturma.
- Toggle ve menü amaçlı elementlerde `button type="button"` kullan.
- Gerçek dış bağlantılar ve bilinçli hard redirectler istisnadır.

## C. Yetkilendirme

- Frontend guard ve UI gizleme **gerçek güvenlik sınırı değildir**; backend capability kontrolü esastır.
- Capability değişikliğinde backend `internal/authz/capabilities.go` ile senkronizasyonu kontrol et.
- Güncel kaynak: `lib/authz/capabilities.ts`
- Mevcut roller: `ADMIN`, `HR`, `FINANCIAL`, `EMPLOYEE`. Sabit listeyi nihai kaynak sayma; güncel rol ve capability tanımlarını yaşayan koddan doğrula.

## D. Kod kapsamı

- Task dışı component refactor veya geniş kapsamlı yeniden yapılandırma yapma.
- Mevcut App Router (`app/`) ve klasör yapısını koru.
- Generated dosyaları (`next-env.d.ts`, build çıktıları) manuel değiştirme.
- `next-env.d.ts` task dışı değişirse restore et.

## E. Git ve güvenlik

- `main` / `master` üzerinde değişiklik yapma.
- Açık talimat olmadan commit, push veya PR oluşturma.
- Açık talimat olmadan pull, fetch, merge veya rebase yapma.
- Task kapsamı dışı dosyaya dokunma.
- `.env` ve secret içeriğini okuma veya değiştirme.
- Token veya credential loglama.
- Gerçek API veya veritabanı çağrısı yapma.

## F. Task risk seviyeleri

| Seviye | Örnek | Yaklaşım |
|---|---|---|
| **Düşük** | CSS hizası, label, küçük görsel bug | Tek tur; 1–3 dosya |
| **Orta** | Form, API entegrasyonu, pagination, filtre | İlgili sayfa + service; lint; build yalnız route/config/integration veya geniş kapsamlı değişiklikte |
| **Yüksek** | Auth, session, token, capability sync | Önce plan; BE authz ile birlikte değerlendir |

## G. Doğrulama

Komutlar `package.json` scriptlerine göre:

- `npm run lint` — lint kontrolü
- `npm run build` — production build doğrulaması (`next.config.js` içinde `ignoreBuildErrors: true`; build TypeScript hatalarını yakalamaz)
- Her düşük/orta taskta otomatik full build zorunlu değildir; route/config/integration, yüksek risk, PR öncesi veya kullanıcı açıkça isterse build çalıştır.
- `git diff --check`
- Build sonrası task dışı generated dosyaları (`next-env.d.ts` vb.) restore et.
- Task dışı TypeScript hatalarını yeni hata gibi sunma. Mümkünse değişiklik öncesi/sonrası sonuç, diff veya task kapsamındaki dosyalar üzerinden `introduced` ve `pre-existing` ayrımı yap; kanıt olmadan hatayı otomatik pre-existing kabul etme.

## H. Referanslar (ihtiyaç halinde aç)

| Konu | Dosya |
|---|---|
| Capability tanımları | `lib/authz/capabilities.ts` |
| Backend capability kaynağı | Backend repo: `internal/authz/capabilities.go` (workspace erişilebiliyorsa birlikte kontrol et; değilse kullanıcıdan BE dosya/diff iste) |
| Backend erişim matrisi | Backend repo: `BACKEND_API_ROLE_MATRIX.md` |
| URL sabitleri | `contants/urls.ts` |
| Searchable select kullanımı | `components/SEARCHABLE_SELECT_GUIDE.md` |
| Detaylı AI workflow | Backend repo: `docs/AI_CODING_GUIDE.md` |
| Token optimizasyon analizi | Backend repo: `docs/AI_TOKEN_OPTIMIZATION.md` |

> **Stale uyarı:** Backend `README.md` ve `docs/project_analysis.md` içindeki eski role anlatımları güncel olmayabilir. Auth tasklarında yaşayan kod ve capability kaynaklarını esas al.
