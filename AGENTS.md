# AGENTS.md — Kartezya HR Frontend

Araçtan bağımsız AI coding kuralları. Uzun component veya route listeleri burada değil.

Bu dosya her AI aracında otomatik yüklenmeyebilir; yüklenmiyorsa kullanıcı veya ekip task context'ine eklemelidir.

## A. Proje özeti

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript
- **HTTP:** Axios (`services/`, `helpers/api/`)
- **Stil:** Bootstrap, react-bootstrap, SCSS
- **Yetkilendirme:** Capability tabanlı UI kontrolleri (`lib/authz/`)
- **Production sunum:** Static export (`out/`) + Go server (`main.go`, `build:go`); development-only Next.js davranışlarını production'da varsayma

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

## E. Production-first

- Frontend değişikliklerini yalnız local development ortamına göre tasarlama.
- API base URL, OAuth callback, asset path ve benzeri environment değerlerini hardcode etme.
- `NEXT_PUBLIC_*` değerleri build sırasında bundle'a gömülür; runtime'da değişeceğini varsayma.
- Localhost, Railway fallback veya tek-ortam URL'sini production gerçeği sanma.
- Static export nedeniyle `middleware.ts`, server-side rewrite veya Next runtime davranışlarının production'da çalıştığını varsayma.
- Frontend guard ve client-side redirect güvenlik sınırı değildir; backend capability ve API doğrulaması esastır.
- Local'de çalışan navigasyon/auth çözümünün static export + Go server üzerinde de uyumlu olup olmadığını değerlendir.

## F. Git ve güvenlik

- `main` / `master` üzerinde değişiklik yapma.
- Açık talimat olmadan commit, push veya PR oluşturma.
- Açık talimat olmadan pull, fetch, merge veya rebase yapma.
- History değiştiren, veri kaybına yol açabilecek veya geri dönüşü zor Git işlemleri (amend, force push, reset --hard, clean, branch silme, stash pop/drop, restore/checkout ile dosya kaybı, cherry-pick/revert) açık kullanıcı izni olmadan yapılmaz.
- Task kapsamı dışı dosyaya dokunma.
- `.env` ve secret içeriğini okuma veya değiştirme.
- `.env.example` yalnız key/config şemasını anlamak için kullanılabilir; örnek değerler production gerçeği veya güvenli credential sayılmaz.
- Prompt, terminal veya dosya içinde secret/token/credential görülürse tekrar edilmez, loglanmaz veya başka dosyaya kopyalanmaz; raporda redakte edilir.
- Token veya credential loglama.
- Gerçek API veya veritabanı çağrısı yapma.

## G. Task risk seviyeleri

| Seviye | Örnek | Yaklaşım |
|---|---|---|
| **Düşük** | CSS hizası, label, küçük görsel bug | Tek tur; 1–3 dosya |
| **Orta** | Form, API entegrasyonu, pagination, filtre | İlgili sayfa + service; lint; build yalnız route/config/integration veya geniş kapsamlı değişiklikte |
| **Yüksek** | Auth, session, token, capability sync | Önce plan; BE authz ile birlikte değerlendir |

## H. Doğrulama

Komutlar `package.json` scriptlerine göre:

- `npm run lint` — lint kontrolü
- `npm run build` — production build doğrulaması (`next.config.js` içinde `ignoreBuildErrors: true`; build TypeScript hatalarını yakalamaz)
- Her düşük/orta taskta otomatik full build zorunlu değildir; route/config/integration, yüksek risk, PR öncesi veya kullanıcı açıkça isterse build çalıştır.
- `git diff --check`
- Build sonrası task dışı generated dosyaları (`next-env.d.ts` vb.) restore et.
- Task dışı TypeScript hatalarını yeni hata gibi sunma. Mümkünse değişiklik öncesi/sonrası sonuç, diff veya task kapsamındaki dosyalar üzerinden `introduced` ve `pre-existing` ayrımı yap; kanıt olmadan hatayı otomatik pre-existing kabul etme.

## I. Referanslar (ihtiyaç halinde aç)

| Konu | Dosya |
|---|---|
| Capability tanımları | `lib/authz/capabilities.ts` |
| Backend capability kaynağı | Backend repo: `internal/authz/capabilities.go` (workspace erişilebiliyorsa birlikte kontrol et; değilse kullanıcıdan BE dosya/diff iste) |
| Backend erişim matrisi | Backend repo: `BACKEND_API_ROLE_MATRIX.md` |
| URL/config yapısı | `contants/urls.ts` |
| Production build ayarı | `next.config.js` |
| Go static server | `main.go` |
| Searchable select kullanımı | `components/SEARCHABLE_SELECT_GUIDE.md` |
| Detaylı AI workflow | Backend repo: `docs/AI_CODING_GUIDE.md` |
| Token optimizasyon analizi | Backend repo: `docs/AI_TOKEN_OPTIMIZATION.md` (analiz kaydı; her taskta açma) |

> **Stale uyarı:** Backend `README.md` ve `docs/project_analysis.md` içindeki eski role anlatımları güncel olmayabilir. Auth tasklarında yaşayan kod ve capability kaynaklarını esas al.
