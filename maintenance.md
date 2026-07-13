# Maintenance & Architecture Guide

Dokumen ini ditujukan sebagai panduan pemeliharaan sistem, struktur database, serta relasi antarentitas untuk memudahkan pengembangan lebih lanjut. Didesain secara detail dan ringkas agar AI agen dapat mempelajari konteks repository ini secara efisien dengan konsumsi token seminimal mungkin.

---

## 1. Arsitektur & Teknologi Utama
- **Framework:** Next.js (App Router) + React 19
- **Database:** MongoDB (dengan Mongoose ODM)
- **Auth:** NextAuth.js v5 (Google OAuth untuk User/Learner biasa, Credentials Provider (Email/Password) untuk Administrator Staff (Admin, Superadmin) dan Partner)
- **Styling & Theme:** Tailwind CSS v4 (menggunakan inline theme & CSS variables). Mode Gelap menggunakan `.dark` class styling.
- **Animations:** **Framer Motion** untuk micro-interactions (hover, transitions) & **GSAP** untuk complex entry timeline animations pada landing page.
- **Typography:** Google Fonts (**Nunito** untuk Headings/UI, **JetBrains Mono** untuk Code).
- **Code Editor Engine:** Monaco Editor (melalui `@monaco-editor/react`) untuk rendering input kode monospaced premium.
- **Code Execution Sandbox:** Client-Side Sandbox menggunakan `iframe` reaktif (melalui properti `srcDoc`) untuk pratinjau HTML/CSS/JS dan Web Workers untuk JS coding challenges.
- **YouTube Video Auto-Embed:** Interseptor tautan kustom pada component `a` di `ReactMarkdown` yang mendeteksi URL video YouTube dan mengubahnya menjadi pemutar video iframe responsif secara instan.

---

## 2. Struktur Database & Relasi (MongoDB / Mongoose)

Sistem ini didesain menggunakan skema relasional di atas MongoDB menggunakan referensi ID (`Schema.Types.ObjectId`) untuk integritas data.

```mermaid
erDiagram
    USER ||--o{ PARTNER-APPLICATION : submits
    USER ||--o{ ROADMAP : creates
    USER ||--o{ USER-PROGRESS : tracks
    USER ||--o{ VERIFICATION-CODE : owns
    ROADMAP ||--o{ MATERIAL : contains
    ROADMAP ||--o{ QUIZ : contains
    ROADMAP ||--o{ CODE-CHALLENGE : contains
    MATERIAL ||--o| QUIZ : links
    MATERIAL ||--o| CODE-CHALLENGE : links
    USER-PROGRESS ||--o{ QUIZ-ATTEMPT : records
    USER-PROGRESS ||--o{ CHALLENGE-SUBMISSION : records
```

### Penjelasan Relasi:
1. **`User`** (`src/lib/models/User.ts`): Menyimpan semua data pengguna. Peran akun (`role`) adalah `'user'` (Learner), `'partner'`, `'admin'`, atau `'superadmin'`.
2. **`VerificationCode`** (`src/lib/models/VerificationCode.ts`): Menyimpan data kode OTP untuk password reset atau pergantian email. Menggunakan MongoDB TTL index pada kolom `expiresAt` untuk penghapusan otomatis data setelah kedaluwarsa (10 menit).
3. **`PartnerApplication`** (`src/lib/models/PartnerApplication.ts`): Menyimpan pengajuan pengguna biasa untuk menjadi `'partner'`. Berelasi *one-to-one* dengan `User` (berdasarkan `userId`). Disetujui atau ditolak oleh Admin/Superadmin.
4. **`Roadmap`** (`src/lib/models/Roadmap.ts`): Menyimpan struktur roadmap. Setiap roadmap dibuat oleh `'partner'`, `'admin'`, atau `'superadmin'`. Di dalamnya terdapat array objek `nodes` yang mendefinisikan posisi koordinat, jenis node (`'phase'`, `'topic'`, `'quiz'`, `'challenge'`), serta hierarkinya (`parentId`).
5. **`Material`** (`src/lib/models/Material.ts`): Konten pembelajaran berformat Markdown. Setiap material merujuk ke satu `Roadmap` (`roadmapId`) dan terikat ke satu node di dalam roadmap (`nodeId`). Dapat memiliki tautan opsional ke kuis (`quizId`) atau tantangan coding (`challengeId`).
6. **`Quiz`** (`src/lib/models/Quiz.ts`): Menyimpan soal-soal pilihan ganda beserta kunci jawaban dan limit waktu. Terikat ke satu `Roadmap` dan `nodeId`.
7. **`CodeChallenge`** (`src/lib/models/CodeChallenge.ts`): Tantangan coding interaktif. Menyimpan deskripsi tantangan, kode awal (`initialCode`), bahasa pemrograman, serta test cases (assertion code) untuk memvalidasi input user secara langsung di browser.
8. **`UserProgress`** (`src/lib/models/UserProgress.ts`): Menyimpan status belajar user. Berelasi dengan `User` (`userId`) dan `Roadmap` (`roadmapId`). Menyimpan array dari `completedNodes` (ID node yang telah diselesaikan), hasil kuis (`quizAttempts`), dan submisi coding (`challengeSubmissions`).

---

## 3. Struktur Direktori Project

```text
d:\konten\mulaidarinol\
├── src/
│   ├── app/                      # Next.js App Router Pages
│   │   ├── api/                  # API Route Handlers (SSE, Progress, CMS, dll.)
│   │   │   ├── seed/             # Seeding DB (Aman: Di-disable di Prod, Butuh Key di Dev)
│   │   ├── cms/                  # Workspace CMS (Superadmin, Admin, Partner)
│   │   │   ├── (dashboard)/      # Sub-direktori Route Group ber-sidebar & layout terproteksi
│   │   │   │   ├── materials/    # Kelola Isi Materi (Markdown + Media)
│   │   │   │   ├── partners/     # Kelola Review Pengajuan Partner
│   │   │   │   ├── quizzes/      # Kelola Ujian Kuis & Code Challenge
│   │   │   │   ├── roadmaps/     # Kelola Roadmap & Nodes
│   │   │   │   ├── settings/     # Pengaturan Profil, Ganti Email, & Ganti Password via OTP
│   │   │   │   ├── users/        # User & Partner Management (Superadmin Only)
│   │   │   │   │   ├── admins/   # Admin Staff Management (Superadmin Only)
│   │   │   │   ├── layout.tsx    # Layout Terproteksi CMS (Role guard & sidebar links)
│   │   │   │   └── page.tsx      # Analytics & Dashboard CMS
│   │   │   └── login/            # Halaman login khusus Admin/Partner (Bypass sidebar layout)
│   │   ├── login/                # Login User Umum (Google OAuth)
│   │   ├── roadmaps/             # Halaman Roadmap (Canvas & Flow View)
│   │   │   ├── [slug]/           # Canvas Roadmap Tree Viewer
│   │   │   └── [slug]/[nodeId]/  # Learning Console (Workspace)
│   │   ├── globals.css           # Styling Global & Tailwind v4 Variables
│   │   ├── layout.tsx            # Root Layout, Theme Providers, Google Fonts Loader
│   │   └── page.tsx              # Landing Page utama (GSAP + Framer Motion Client component Wrapper)
│   ├── components/               # Reusable Components
│   │   ├── LandingPageClient.tsx # Redesign premium Landing Page (GSAP & Framer Motion)
│   │   ├── UserPartnerManager.tsx# Tabel Manajemen Pengguna Reguler & Partners
│   │   ├── AdminStaffManager.tsx # Tabel & Registrasi Administrator Baru
│   │   ├── ConsoleWorkspace.tsx  # Layout belajar reaktif (Centering single button layout)
│   │   ├── ConsoleEditor.tsx     # Code Editor dengan Iframe Sandbox reaktif via srcDoc
│   │   ├── ConsoleQuiz.tsx       # Engine timed-quiz interaktif
│   │   ├── Navbar.tsx            # Navigation Bar Publik (Theme-reaktif Logo Light/Dark)
│   │   └── Footer.tsx            # Footer Publik (Theme-reaktif Logo Light/Dark)
│   ├── lib/                      # Helper library & Configuration
│   │   ├── models/               # Mongoose Database Schemas
│   │   ├── auth.ts               # Konfigurasi NextAuth.js (Provider & JWT hooks)
│   │   ├── db.ts                 # Koneksi MongoDB (Singleton Pattern)
│   │   └── utils.ts              # Helper functions (clsx, tailwind-merge)
│   ├── hooks/                    # Custom React Hooks
│   └── middleware.ts             # Next.js Middleware untuk Proteksi CMS & API
```

---

## 4. Konfigurasi Lingkungan (.env.local)
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=rahasia-super-aman-generasi-next-auth

# Google OAuth (Untuk User/Learner Login)
AUTH_GOOGLE_ID=google-client-id-anda
AUTH_GOOGLE_SECRET=google-client-secret-anda

# SMTP Email Configuration (Nodemailer OTP Reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=email-keamanan@gmail.com
SMTP_PASS=password-aplikasi-anda

# Security Seeding Key
SEED_API_KEY=MulaidarinolSeed2026
```

---

## 5. Keamanan & Proteksi Sistem (Anti-Exploit)
1. **Rute `/api/seed`:**
   - Dilarang keras dipanggil pada environment production (`process.env.NODE_ENV === 'production'`) untuk menghindari reset database secara tidak sengaja atau disengaja.
   - Pada environment non-production, rute ini membutuhkan parameter query `?key=KEY_VERIFIKASI` (default: `MulaidarinolSeed2026`) untuk mencegah penghapusan data secara tidak sengaja oleh bot crawler.
2. **Rute `/cms/*` & API CMS:**
   - Seluruh endpoint dilindungi di level server action menggunakan session validation (`getCmsSession`, `getAdminSession`, `getSuperadminSession`).
   - Sisi UI dilindungi via middleware dan route layout matching. Peran reguler (`'user'`) tidak akan dapat mengakses file dashboard.
3. **Password Reset OTP Verification:**
   - Reset password mengharuskan superadmin/admin mengirim kode OTP 6-digit ke email terdaftar.
   - Kode OTP disimpan terenkripsi dengan masa kedaluwarsa otomatis (10 menit) menggunakan indeks waktu MongoDB TTL.
   - Mutasi data baru akan diaplikasikan di database hanya setelah pencocokan kode OTP berhasil.

---

## 6. Pemeliharaan Terakhir & Log Perubahan (Juli 2026)

Berikut adalah log perubahan arsitektur dan sistem yang dilakukan untuk kebutuhan pemeliharaan developer manusia maupun AI selanjutnya:

### A. Perbaikan NextAuth ClientFetchError
- **Penyebab:** Penumpukan file cache Turbopack/Next.js dev di folder `.next/` yang tidak sinkron, menyebabkan server mengembalikan halaman HTML 404/redirect saat client memanggil endpoint JSON `/api/auth/session`.
- **Solusi:** Penghapusan folder `.next` dan rebuild ulang cache secara bersih.
- **Middleware Proteksi:** Mengganti nama file `src/proxy.ts` menjadi `src/middleware.ts` (standar Next.js) dengan konfigurasi `matcher: ["/cms/:path*"]` agar hanya memproteksi area admin `/cms/*` dan membiarkan rute API otentikasi berjalan bebas tanpa overhead middleware.

### B. Implementasi RBAC Single-Superadmin Ketat
- **Batasan Skema:** Sistem hanya mengizinkan maksimal **satu** Superadmin terdaftar di database.
- **Server Action (`src/app/actions/cms.ts`):** 
  - Validasi ditambahkan di `createNewAdmin` dan `updateUserRole` untuk memblokir penambahan/promosi superadmin baru jika satu akun superadmin sudah terdeteksi di database.
  - Menghalangi akun Superadmin menurunkan perannya sendiri jika dia adalah satu-satunya superadmin di sistem (agar sistem tidak terkunci tanpa pengelola utama).
- **UI Admin (`src/components/AdminStaffManager.tsx`):**
  - Dropdown role di form pendaftaran admin dikunci hanya untuk "Admin".
  - Tombol edit/ubah peran untuk akun berstatus `superadmin` dinonaktifkan di tabel manajemen admin (Protected Owner).

### C. Pembuatan Engine & CMS Artikel (SEO & GEO Booster)
- **Model database (`src/lib/models/Article.ts`):** Skema data `Article` dengan parameter penargetan SEO lokal Indonesia (`seoTitle`, `seoDescription`, `seoKeywords`).
- **Server Actions (`src/app/actions/article.ts`):** Menangani operasi simpan (`saveArticle`), hapus (`deleteArticle`), ambil artikel CMS (`getCmsArticles`), ambil artikel publik terpaginasi dengan pencarian (`getArticles`), dan ambil detail artikel (`getArticleBySlug`).
- **CMS Artikel UI:**
  - Halaman List Artikel (`src/app/cms/(dashboard)/articles/page.tsx`).
  - Halaman Editor Artikel (`src/app/cms/(dashboard)/articles/[id]/page.tsx`) dengan dukungan live markdown editor preview.
- **Rute Publik Artikel:**
  - Halaman Beranda Blog (`src/app/articles/page.tsx`) terpaginasi.
  - Halaman Detail Blog (`src/app/articles/[slug]/page.tsx`) dengan render markdown.
- **Alur Otentikasi Latihan**: Pengunjung tanpa login (tamu) yang mengakses halaman kuis pilihan ganda (`quiz/page.tsx`) atau tantangan kode (`challenge/page.tsx`) akan secara server-side langsung dialihkan ke `/login` dengan parameter `callbackUrl` kembali ke halaman latihan semula agar progres latihan tersimpan otomatis pasca login Google.
- **Penyelarasan Spasi Visual (Padding)**: 
  - Menambahkan `pb-16` pada container navigasi material console agar tombol "Selanjutnya/Sebelumnya" tidak menempel rapat di bagian bawah viewport.
  - Menambahkan `pb-24` pada scrollable area daftar materi sidebar agar item paling bawah (seperti modul "Generative UI") tidak terpotong atau terhalang oleh tombol floating logo branding "N".

### D. Optimasi SEO & GEO Indonesia
- **Robots.txt (`src/app/robots.ts`):** Dibuat dinamis mengizinkan indexing seluruh rute publik dan memblokir crawl `/cms/*` & `/api/*`.
- **Sitemap (`src/app/sitemap.ts`):** Menambahkan link artikel publik secara dinamis dengan indeks prioritas tinggi.
- **JSON-LD Schema Markup:**
  - Global: Skema `WebSite` & `Organization` di root layout (`src/app/layout.tsx`).
  - Lokal/Artikel: Skema `BlogPosting` dan `Blog` di halaman artikel untuk rich snippets Google Search.
