# AGENTS.md — Kartezya HR Frontend

Araçtan bağımsız AI coding kuralları. Bu dosya frontend repo için tek başına yeterlidir; backend dosyalarının varlığını varsayma.
Otomatik yükleme araçlara bağlıdır; tüm AI araçlarında kesin çalıştığı iddia edilmez.

## A. Instruction hierarchy

- Root `AGENTS.md` project-wide normative source'tur; scoped `AGENTS.md` yalnız kendi klasörüne özgü kurallar ekler.
- Adapter files bağımsız kural tanımlamaz ve ana kuralları kopyalamaz.
- Kullanıcı talebi güvenlik/repo politikasını ihlal etmediği sürece uygulanır; kod gerçeği stale dokümandan üstündür.

## B. Proje özeti

- **Framework:** Next.js 16 (App Router) · **UI:** React 19, TypeScript
- **HTTP:** Axios (`services/`, `helpers/api/`) · **Stil:** Bootstrap, react-bootstrap, SCSS
- **Authz UI:** `lib/authz/` · **Prod sunum:** static export (`out/`) + Go server (`main.go`, `build:go`)

## C. Navigasyon

- Uygulama içi geçişte `next/link` veya Next.js router; gereksiz native `<a href>` full reload yok.
- Toggle/menü için `button type="button"`. Dış link ve bilinçli hard redirect istisna.

## D. Task başlangıcı ve kök neden

- İlgili UI/API akışını uçtan uca incele; semptomu bastırma, kök nedeni bul.
- Yalnız gerekli dosyaları aç; bilinmeyeni tahmin etme; varsayımları belirt.
- Loading, error ve empty state'i değerlendir; filter/sort/pagination'ı API contract ile uyumlu tut.
- Risk sınıfını belirle (bkz. J). Net düşük/orta bugfixte gereksiz onay bekleme.

## E. Yetkilendirme

- Frontend guard ve UI gizleme **güvenlik sınırı değildir**; backend capability enforcement esastır.
- Güncel kaynak: `lib/authz/capabilities.ts`. Roller: `ADMIN`, `HR`, `FINANCIAL`, `EMPLOYEE` — sabit listeyi nihai sayma; yaşayan koddan doğrula.
- Capability sync için BE `internal/authz/capabilities.go` yalnız multi-root veya kullanıcı BE diff verdiyse; FE-only'da BE path varsayma.

## F. Kod kapsamı

- Task dışı component refactor veya geniş yeniden yapılandırma yapma; App Router (`app/`) yapısını koru.
- Browser/server boundary'yi ilgili tasklarda değerlendir. Generated dosyaları manuel “düzeltme” bahanesiyle değiştirme.

## G. Locale, tarih ve timezone

- System/browser locale'a güvenme; tarih/saat/sayı/para/sıralamada örtük locale kullanma.
- Display string'i storage/API formatı gibi parse etme; API/storage locale-independent; UI formatını API'ye geri yazma.
- Browser, backend, DB ve scheduler timezone eşitliğini varsayma.
- `tr-TR` / `en-US` vb. locale'ı hata bastırmak için hardcode etme; locale yalnız ürün standardı varsa.
- Sıralama (ör. Türkçe karakter) ve FE/BE filtre-tarih semantiğini ürün gereksinimine göre uyumlu tut.

## H. Production-first

- Local-only development çözümüne göre tasarlama; production'da static export + Go server gerçeğini esas al.
- `middleware.ts`, SSR rewrite veya Next runtime davranışlarının production'da çalıştığını varsayma; local navigasyon/auth'un `out/` + Go server ile uyumunu değerlendir.
- API base URL, OAuth callback, asset path hardcode etme. `NEXT_PUBLIC_*` build-time gömülür; runtime'da değişmez.
- Local `.env`, localhost, Railway fallback veya tek-ortam URL'sini production gerçeği sanma.
- Timeout/sleep/delay/restart/manual refresh/cache temizlemeyi kalıcı çözüm sayma; silent fallback ile prod hatasını gizleme.

## I. Git, WIP ve güvenlik

- `main`/`master` üzerinde değişiklik yapma; açık istek olmadan commit/push/PR/pull/fetch/merge/rebase yapma.
- Destructive Git (amend, force push, reset --hard, clean, branch silme, stash pop/drop, restore/checkout ile kayıp, cherry-pick/revert) izinsiz yok.
- Kullanıcı WIP'sini revert/overwrite/format bahanesiyle değiştirme; task dışı dosyaya dokunma.
- `.env`/secret okuma-değiştirme yok; token/credential loglama yok; görülen secret'ı tekrar etme, redakte et. Gerçek API/DB çağrısı yapma.
- `.cursorignore` / `.geminiignore` discovery filtresidir; hard security deny değildir.

## J. Task risk seviyeleri

| Seviye | Örnek | Yaklaşım |
|---|---|---|
| **Düşük** | CSS, label | Tek tur; 1–3 dosya |
| **Orta** | Form, API, pagination | Sayfa + service; lint; build yalnız route/config/integration veya geniş kapsamda |
| **Yüksek** | Auth, session, token, capability sync | Plan; BE authz erişilebilirse birlikte |

## K. Doğrulama

Komutlar `package.json` scriptlerine göre:

- En yakın validation'dan başla; risk yükseldikçe artır. `npm run lint`; `git diff --check`.
- `npm run build`: `next.config.js` içinde `ignoreBuildErrors: true` — build TypeScript hatalarını yakalamaz; type-safety / başarı garantisi vermez. Full build her düşük/orta taskta zorunlu değil; route/config/integration, yüksek risk, PR öncesi veya kullanıcı isterse çalıştır.
- Task dışı generated (`next-env.d.ts` vb.) değişirse restore et. TS hatalarında `introduced` vs `pre-existing` ayrımı yap; kanıtsız pre-existing sayma.
- Test/build yoksa “çalışıyor / tamamen çözüldü” deme; eksik kontrol ve kalan riski raporla.

## L. Conditional references

Bu repo tek başına yeterlidir. Listelenmek her contextte okumak demek değildir. Adapter ayrıntılı rehber değildir. Normal UI/styling/isolated bug fix/component refactor'da backend docs arama.

- FE ihtiyaç halinde: `lib/authz/capabilities.ts`, `contants/urls.ts`, `next.config.js`, `main.go`, `components/SEARCHABLE_SELECT_GUIDE.md`.
- Backend `docs/AI_CODING_GUIDE.md` yalnız multi-root'ta dosya gerçekten varsa ve task (1) auth/capability contract, (2) BE/FE ortak filtre/sort/date semantics, (3) production API/config/deployment, (4) kullanıcının açıkça plan/workflow istemesi, (5) validation stratejisinin bu dosyayla belirlenememesi — o zaman opsiyonel; yalnız ilgili bölüm. “Cross-layer” tek başına yeterli değil.
- Backend `docs/AI_TOKEN_OPTIMIZATION.md` yalnız AI instruction/token/tool/management reporting'de; normal FE işinde açma.
- Capability sync/matrix: multi-root veya kullanıcı BE diff verdiyse `internal/authz/capabilities.go`, `BACKEND_API_ROLE_MATRIX.md`.

> **Stale:** Backend README / `docs/project_analysis.md` eski role anlatabilir; auth'ta yaşayan kod ve capability kaynaklarını esas al.
