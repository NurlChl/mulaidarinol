# Maintenance & Architecture Guide

Dokumen ini ditujukan sebagai panduan pemeliharaan sistem, struktur database, serta relasi antarentitas untuk memudahkan pengembangan lebih lanjut (baik oleh developer manusia maupun AI agen berikutnya).

---

## 1. Arsitektur & Teknologi Utama
- **Framework:** Next.js (App Router, Versi Terbaru) + React 19
- **Database:** MongoDB (dengan Mongoose ODM)
- **Auth:** NextAuth.js v5 (Google OAuth untuk User biasa, Credentials Provider (Email/Password) untuk Superadmin, Admin, dan Partner)
- **Styling:** Tailwind CSS v4 (menggunakan inline theme & CSS variables)
- **Typography:** Google Fonts (**DM Sans** untuk Headings, **Plus Jakarta Sans** untuk Body). Konfigurasi terintegrasi di `src/app/layout.tsx` dan global CSS.
- **Code Editor Engine:** Monaco Editor (melalui `@monaco-editor/react`) untuk rendering input kode monospaced premium dengan line-numbers, syntax highlighting, dan autocomplete kelas dunia (engine yang mentenagai VS Code).
- **Code Execution Sandbox:** Client-Side Sandbox menggunakan `iframe` reaktif (melalui properti `srcDoc`) untuk pratinjau HTML/CSS/JS dan Web Workers untuk JS coding challenges.
- **Resizable Workspace Layout:** 
  - Bilah sisi daftar materi (Sidebar) dapat digeser ukurannya (drag-to-resize width).
  - Pembagi utama antara bacaan materi dan konsol kuis/latihan dapat diseret horizontal (pada mode kolom) atau diseret vertikal (pada mode baris).
  - Terdapat opsi toggle tata letak (Tampilan Baris vs Tampilan Kolom) di header utama untuk kenyamanan belajar siswa.
  - Custom React mouse listener (`onMouseDown`) digunakan untuk merespons sash drag secara responsif.
- **YouTube Video Auto-Embed:** Interseptor tautan kustom pada component `a` di `ReactMarkdown` yang mendeteksi URL video YouTube dan mengubahnya menjadi pemutar video iframe responsif secara instan tanpa meninggalkan aplikasi.

---

## 2. Struktur Database & Relasi (MongoDB / Mongoose)

Sistem ini didesain menggunakan skema relasional di atas MongoDB menggunakan referensi ID (`Schema.Types.ObjectId`) untuk integritas data.

```mermaid
erDiagram
    USER ||--o{ PARTNER-APPLICATION : submits
    USER ||--o{ ROADMAP : creates
    USER ||--o{ USER-PROGRESS : tracks
    ROADMAP ||--o{ MATERIAL : contains
    ROADMAP ||--o{ QUIZ : contains
    ROADMAP ||--o{ CODE-CHALLENGE : contains
    MATERIAL ||--o| QUIZ : links
    MATERIAL ||--o| CODE-CHALLENGE : links
    USER-PROGRESS ||--o{ QUIZ-ATTEMPT : records
    USER-PROGRESS ||--o{ CHALLENGE-SUBMISSION : records
```

### Penjelasan Relasi:
1. **`User`**: Menyimpan semua data pengguna. Atribut `role` bernilai `'user'`, `'partner'`, `'admin'`, atau `'superadmin'`.
2. **`PartnerApplication`**: Menyimpan pengajuan pengguna biasa (`role: 'user'`) untuk menjadi `'partner'`. Berelasi *one-to-one* dengan `User` (berdasarkan `userId`). Disetujui atau ditolak oleh Admin/Superadmin.
3. **`Roadmap`**: Menyimpan struktur roadmap. Setiap roadmap dibuat oleh `'partner'`, `'admin'`, atau `'superadmin'`. Di dalamnya terdapat array objek `nodes` yang mendefinisikan posisi koordinat, jenis node (fase, topik, kuis, tantangan), serta hierarkinya (`parentId`).
4. **`Material`**: Konten pembelajaran berformat Markdown. Setiap material merujuk ke satu `Roadmap` (`roadmapId`) dan terikat ke satu node di dalam roadmap (`nodeId`). Dapat memiliki tautan opsional ke kuis (`quizId`) atau tantangan coding (`challengeId`).
5. **`Quiz`**: Menyimpan soal-soal pilihan ganda beserta kunci jawaban dan limit waktu. Terikat ke satu `Roadmap` dan `nodeId`.
6. **`CodeChallenge`**: Tantangan coding interaktif. Menyimpan deskripsi tantangan, kode awal (`initialCode`), bahasa pemrograman, serta test cases (assertion code) untuk memvalidasi input user secara langsung di browser.
7. **`UserProgress`**: Menyimpan status belajar user. Berelasi dengan `User` (`userId`) dan `Roadmap` (`roadmapId`). Menyimpan array dari `completedNodes` (ID node yang telah diselesaikan), hasil kuis (`quizAttempts`), dan submisi coding (`challengeSubmissions`).

---

## 3. Struktur Direktori Project

```text
d:\konten\mulaidarinol\
├── src/
│   ├── app/                      # Next.js App Router Pages
│   │   ├── api/                  # API Route Handlers (SSE, Progress, CMS, dll.)
│   │   ├── cms/                  # Workspace CMS (Superadmin, Admin, Partner)
│   │   │   ├── (dashboard)/      # Sub-direktori Route Group ber-sidebar & layout terproteksi
│   │   │   │   ├── materials/    # Kelola Isi Materi (Markdown + Media)
│   │   │   │   ├── partners/     # Kelola Review Pengajuan Partner
│   │   │   │   ├── quizzes/      # Kelola Tes Ujian & Code Challenge
│   │   │   │   ├── roadmaps/     # Kelola Roadmap & Nodes
│   │   │   │   ├── users/        # Kelola Role & Tambah Admin (Superadmin Only)
│   │   │   │   ├── layout.tsx    # Layout Terproteksi CMS
│   │   │   │   └── page.tsx      # Analytics & Dashboard CMS
│   │   │   └── login/            # Halaman login khusus Admin/Partner (Bypass sidebar layout)
│   │   ├── login/                # Login User Umum (Google OAuth)
│   │   ├── roadmaps/             # Halaman Roadmap (Canvas & Flow View)
│   │   │   ├── [slug]/           # Canvas Roadmap Tree Viewer
│   │   │   └── [slug]/[nodeId]/  # Learning Console (Controller server-side untuk Workspace)
│   │   ├── globals.css           # Styling Global & Tailwind v4 Variables
│   │   ├── layout.tsx            # Root Layout, Theme Providers, Google Fonts Loader
│   │   └── page.tsx              # Landing Page utama (Grid 8 Roadmap Aktif + Coming Soon)
│   ├── components/               # Reusable Components
│   │   ├── ConsoleWorkspace.tsx  # Layout belajar reaktif ala Dicoding (Sidebar + Slide-out Sandbox)
│   │   ├── ConsoleEditor.tsx     # Code Editor dengan Iframe Sandbox reaktif via srcDoc
│   │   ├── ConsoleQuiz.tsx       # Engine timed-quiz interaktif
│   │   ├── Navbar.tsx            # Navigation Bar Publik
│   │   └── Footer.tsx            # Footer Publik
│   ├── lib/                      # Helper library & Configuration
│   │   ├── models/               # Mongoose Database Schemas
│   │   ├── auth.ts               # Konfigurasi NextAuth.js
│   │   ├── db.ts                 # Koneksi MongoDB (Singleton Pattern)
│   │   └── utils.ts              # Helper functions (clsx, tailwind-merge)
│   ├── hooks/                    # Custom React Hooks (theme, sse, dll.)
│   └── middleware.ts             # Next.js Middleware untuk Proteksi CMS & API
├── package.json
├── tsconfig.json
├── maintenance.md                # Dokumen ini
└── roadmap-webdev.md             # File referensi roadmap web developer
```

---

## 4. Konfigurasi Lingkungan (.env)
Buat file `.env.local` di root direktori dengan variabel berikut:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=rahasia-super-aman-generasi-next-auth

# Google OAuth (Untuk User Login)
AUTH_GOOGLE_ID=google-client-id-anda
AUTH_GOOGLE_SECRET=google-client-secret-anda

# Cloudinary (Untuk Upload Media CMS)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 5. Instruksi Pemeliharaan & Pengembangan
1. **Database Migrasi / Seeding:** Gunakan script `/src/app/api/seed/route.ts` untuk mengisi ulang data default jika ada perubahan struktur database dasar.
2. **Keamanan (Security):**
   - Rute `/cms/*` dilindungi ketat melalui `middleware.ts` menggunakan token NextAuth. Role `'user'` dilarang keras mengakses `/cms/*`.
   - Rute Superadmin (seperti pengelolaan admin baru) diverifikasi kembali di sisi server agar hanya role `'superadmin'` yang bisa melakukan mutasi database.
3. **Optimasi Performa:**
   - Gunakan static rendering (SSR/ISR) pada materi roadmap untuk performa SEO maksimal di Google.
   - Pemuatan Monaco Code Editor harus menggunakan `next/dynamic` dengan opsi `ssr: false` agar tidak membengkak pada ukuran bundle JavaScript awal.
