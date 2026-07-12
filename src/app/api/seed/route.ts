import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Roadmap from "@/lib/models/Roadmap";
import Material from "@/lib/models/Material";
import Quiz from "@/lib/models/Quiz";
import CodeChallenge from "@/lib/models/CodeChallenge";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Block execution in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Forbidden in production environment." },
        { status: 403 }
      );
    }

    // Require authorization key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const expectedKey = process.env.SEED_API_KEY || "MulaidarinolSeed2026";

    if (key !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid seed key." },
        { status: 401 }
      );
    }

    await dbConnect();

    // 1. Clear old collections
    await User.deleteMany({
      email: { $in: ["superadmin@devroadmap.com", "partner@devroadmap.com"] },
    });
    
    // Fetch all existing roadmaps to clear their sub-documents
    const oldRoadmaps = await Roadmap.find({});
    for (const r of oldRoadmaps) {
      await Material.deleteMany({ roadmapId: r._id });
      await Quiz.deleteMany({ roadmapId: r._id });
      await CodeChallenge.deleteMany({ roadmapId: r._id });
    }
    await Roadmap.deleteMany({});

    // 2. Re-create seed users
    const hashedSuperadminPassword = await bcrypt.hash("superadmin123", 10);
    const hashedPartnerPassword = await bcrypt.hash("partner123", 10);

    const superadmin = await User.create({
      name: "Superadmin DevRoadmap",
      email: "superadmin@devroadmap.com",
      password: hashedSuperadminPassword,
      role: "superadmin",
    });

    const partner = await User.create({
      name: "Mitra Kontributor Partner",
      email: "partner@devroadmap.com",
      password: hashedPartnerPassword,
      role: "partner",
      isPartnerApproved: true,
    });

    const creatorId = partner._id;

    // ==========================================
    // 3. SEED 8 DISTINCT ROADMAPS
    // ==========================================

    // --- ROADMAP 1: WEB DEVELOPER ---
    const webdevRoadmap = await Roadmap.create({
      title: "Web Developer",
      slug: "web-developer",
      description: "Kuasai pemrograman web dari nol mutlak. Fokus pada HTML, CSS, JavaScript, Next.js, Node.js, API, hingga deployment.",
      icon: "Code",
      color: "#6366f1", // Indigo
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Foundation", type: "phase", x: 400, y: 50 },
        { id: "html-modern", label: "HTML Modern 2026", type: "topic", parentId: "phase-1", x: 100, y: 150 },
        { id: "css-modern", label: "CSS Modern", type: "topic", parentId: "phase-1", x: 300, y: 150 },
        { id: "js-modern", label: "JavaScript (ES2026)", type: "topic", parentId: "phase-1", x: 500, y: 150 },
        { id: "git-github", label: "Git & GitHub", type: "topic", parentId: "phase-1", x: 700, y: 150 },
        
        { id: "phase-2", label: "Fase 2: Frontend Stack", type: "phase", parentId: "js-modern", x: 400, y: 270 },
        { id: "nextjs-react", label: "Next.js & React 19", type: "topic", parentId: "phase-2", x: 200, y: 370 },
        { id: "tailwind-v4", label: "Tailwind CSS v4 & shadcn", type: "topic", parentId: "phase-2", x: 600, y: 370 },
        
        { id: "phase-3", label: "Fase 3: Backend & API", type: "phase", parentId: "nextjs-react", x: 400, y: 490 },
        { id: "nodejs-express", label: "Node.js & Express", type: "topic", parentId: "phase-3", x: 200, y: 590 },
        { id: "databases-sql-nosql", label: "Databases (SQL & NoSQL)", type: "topic", parentId: "phase-3", x: 600, y: 590 },
        
        { id: "phase-4", label: "Fase 4: Deployment & Cloud", type: "phase", parentId: "nodejs-express", x: 400, y: 710 },
        { id: "vps-docker", label: "VPS Setup & Docker", type: "topic", parentId: "phase-4", x: 400, y: 810 },
      ]
    });

    // --- ROADMAP 2: UI/UX DESIGNER ---
    const uiuxRoadmap = await Roadmap.create({
      title: "UI/UX Designer",
      slug: "ui-ux-designer",
      description: "Pelajari riset pengguna, perancangan wireframe, gaya warna, auto-layout, hingga pembuatan design system di Figma.",
      icon: "Figma",
      color: "#ec4899", // Pink
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Konsep Desain", type: "phase", x: 400, y: 50 },
        { id: "figma-basics", label: "Figma & Auto Layout", type: "topic", parentId: "phase-1", x: 200, y: 150 },
        { id: "design-principles", label: "Prinsip Desain & Warna", type: "topic", parentId: "phase-1", x: 600, y: 150 },
        { id: "phase-2", label: "Fase 2: Prototyping & UX", type: "phase", parentId: "figma-basics", x: 400, y: 270 },
        { id: "wireframing", label: "Wireframing & Lo-Fi", type: "topic", parentId: "phase-2", x: 200, y: 370 },
        { id: "design-systems", label: "Design Systems & Tokens", type: "topic", parentId: "phase-2", x: 600, y: 370 },
      ]
    });

    // --- ROADMAP 3: WORDPRESS DEVELOPER ---
    const wpRoadmap = await Roadmap.create({
      title: "WordPress Developer",
      slug: "wordpress-developer",
      description: "Pelajari arsitektur tema WordPress, custom post types, Gutenberg blocks, hingga headless CMS menggunakan GraphQL.",
      icon: "Settings",
      color: "#21759b", // WordPress blue
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: WP Dasar", type: "phase", x: 400, y: 50 },
        { id: "wp-installation", label: "Instalasi & Theme Setup", type: "topic", parentId: "phase-1", x: 200, y: 150 },
        { id: "wp-cpt-acf", label: "Custom Post Types & ACF", type: "topic", parentId: "phase-1", x: 600, y: 150 },
        { id: "phase-2", label: "Fase 2: Advanced WP", type: "phase", parentId: "wp-cpt-acf", x: 400, y: 270 },
        { id: "wp-headless", label: "Headless WordPress & API", type: "topic", parentId: "phase-2", x: 400, y: 370 },
      ]
    });

    // --- ROADMAP 4: FRAMER DEVELOPER ---
    const framerRoadmap = await Roadmap.create({
      title: "Framer Developer",
      slug: "framer-developer",
      description: "Bangun landing page interaktif dengan Framer. Kuasai transisi, layout reaktif, Framer CMS, dan SEO.",
      icon: "Compass",
      color: "#0055ff", // Framer Blue
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Framer Canvas", type: "phase", x: 400, y: 50 },
        { id: "framer-layout", label: "Stack & Grid Layout", type: "topic", parentId: "phase-1", x: 300, y: 150 },
        { id: "framer-animations", label: "Efek Scroll & Hover", type: "topic", parentId: "phase-1", x: 500, y: 150 },
      ]
    });

    // --- ROADMAP 5: WEBFLOW DEVELOPER ---
    const webflowRoadmap = await Roadmap.create({
      title: "Webflow Developer",
      slug: "webflow-developer",
      description: "Desain halaman web responsif dengan struktur Box Model CSS asli. Kelola Webflow CMS dan interaksi rumit.",
      icon: "Layout",
      color: "#4353ff", // Webflow Blue
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Designer Interface", type: "phase", x: 400, y: 50 },
        { id: "webflow-boxmodel", label: "HTML Box Model di Webflow", type: "topic", parentId: "phase-1", x: 300, y: 150 },
        { id: "webflow-cms", label: "Webflow CMS Collections", type: "topic", parentId: "phase-1", x: 500, y: 150 },
      ]
    });

    // --- ROADMAP 6: WIX DEVELOPER ---
    const wixRoadmap = await Roadmap.create({
      title: "Wix Developer",
      slug: "wix-developer",
      description: "Manfaatkan Wix Studio dan script Velo JavaScript untuk membuat aplikasi web kustom yang canggih.",
      icon: "Sparkles",
      color: "#ff007f", // Wix Pinkish
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Wix Studio", type: "phase", x: 400, y: 50 },
        { id: "wix-studio-basics", label: "Responsive Layouts & Editor", type: "topic", parentId: "phase-1", x: 300, y: 150 },
        { id: "wix-velo-js", label: "Scripting Velo JS", type: "topic", parentId: "phase-1", x: 500, y: 150 },
      ]
    });

    // --- ROADMAP 7: SHOPIFY DEVELOPER ---
    const shopifyRoadmap = await Roadmap.create({
      title: "Shopify Developer",
      slug: "shopify-developer",
      description: "Kuasai ekosistem e-commerce terbesar. Pelajari Liquid engine, kustomisasi tema, dan Shopify Storefront API.",
      icon: "ShoppingBag",
      color: "#96bf48", // Shopify Green
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: Tema Shopify", type: "phase", x: 400, y: 50 },
        { id: "shopify-liquid", label: "Liquid Templating Engine", type: "topic", parentId: "phase-1", x: 300, y: 150 },
        { id: "shopify-storefront-api", label: "Headless Shopify Storefront", type: "topic", parentId: "phase-1", x: 500, y: 150 },
      ]
    });

    // --- ROADMAP 8: AI-POWERED WEB DEVELOPER ---
    const aidevRoadmap = await Roadmap.create({
      title: "AI-Powered Web Dev",
      slug: "ai-powered-web-dev",
      description: "Tingkatkan produktivitas coding hingga 10x lipat dengan Cursor, Windsurf, Claude Code, v0, dan Prompt Engineering.",
      icon: "Globe",
      color: "#10b981", // Emerald
      isPublished: true,
      creatorId,
      nodes: [
        { id: "phase-1", label: "Fase 1: AI Tools", type: "phase", x: 400, y: 50 },
        { id: "ai-editors-setup", label: "Cursor & Windsurf setup", type: "topic", parentId: "phase-1", x: 200, y: 150 },
        { id: "prompt-engineering-dev", label: "Prompt Engineering", type: "topic", parentId: "phase-1", x: 600, y: 150 },
        { id: "phase-2", label: "Fase 2: AI Code Generation", type: "phase", parentId: "ai-editors-setup", x: 400, y: 270 },
        { id: "v0-bolt-prototyping", label: "v0 & Bolt UI Prototyping", type: "topic", parentId: "phase-2", x: 400, y: 370 },
      ]
    });


    // ==========================================
    // 4. SEED MATERIALS (FUN INDONESIAN CONTENT)
    // ==========================================

    // --- A. WEB DEVELOPER ROADMAP MATERIALS ---

    // HTML Modern 2026
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "html-modern",
      title: "Pengantar HTML Modern & Struktur Elemen",
      slug: "berkenalan-dengan-html-modern",
      content: `
# Pengantar HTML Modern & Struktur Elemen

Selamat datang di dunia pemrograman web! Dalam bab ini, kita akan mempelajari dasar dari semua halaman website di internet, yaitu **HTML (HyperText Markup Language)**.

Untuk mempermudah pemahaman Anda, mari tonton video penjelasan interaktif berikut terlebih dahulu sebelum membaca detail materi:

[Video Tutorial Dasar HTML](https://www.youtube.com/watch?v=Q185InPAtkM)

---

## Apa itu HTML?
HTML singkatan dari **HyperText Markup Language**.
- **HyperText** adalah teks yang berfungsi sebagai penghubung (link) ke halaman lain.
- **Markup Language** adalah bahasa penanda menggunakan tanda-tanda khusus (disebut **Tag**) untuk memberi tahu browser bagaimana teks atau konten harus ditampilkan.

> [!NOTE]
> HTML bukanlah bahasa pemrograman (programming language), karena HTML tidak memiliki logika matematika, percabangan (if-else), atau perulangan (loops). HTML adalah bahasa penanda struktur dokumen.

---

## Apa itu Tag HTML & Cara Menggunakannya?
Sebagian besar elemen HTML dibangun menggunakan **Tag Pembuka** dan **Tag Penutup**, dengan isi konten di antaranya.

Format penulisan umum:
\`\`\`html
<nama_tag>Konten di dalamnya...</nama_tag>
\`\`\`

Contoh:
- Tag pembuka: \`<h1>\`
- Konten: \`Halo Dunia\`
- Tag penutup: \`</h1>\`

Beberapa tag tidak memiliki konten dan tidak memerlukan tag penutup. Tag jenis ini dinamakan **Self-Closing Tag** (tag penutup mandiri), contohnya tag gambar \`<img>\` dan tag input \`<input>\`.

---

## Elemen Dasar HTML yang Sering Digunakan

Berikut adalah elemen-elemen fundamental yang wajib Anda ketahui (referensi dari [W3Schools HTML Tutorial](https://www.w3schools.com/html/)):

### 1. Heading (Judul): \`<h1>\` sampai \`<h6>\`
Digunakan untuk membuat judul atau sub-judul. \`<h1>\` adalah tingkatan judul terbesar/terpenting, sedangkan \`<h6>\` adalah yang terkecil.
\`\`\`html
<h1>Ini Judul Utama</h1>
<h2>Ini Sub-judul Kedua</h2>
<h3>Ini Sub-judul Ketiga</h3>
\`\`\`

### 2. Paragraf: \`<p>\`
Digunakan untuk menulis paragraf teks panjang.
\`\`\`html
<p>Ini adalah sebuah paragraf teks yang berisi penjelasan materi belajar kita.</p>
\`\`\`

### 3. Tombol: \`<button>\`
Digunakan untuk membuat tombol interaktif yang bisa diklik.
\`\`\`html
<button>Klik Saya!</button>
\`\`\`

### 4. Gambar: \`<img>\`
Digunakan untuk menampilkan gambar. Tag ini menggunakan atribut \`src\` (sumber lokasi gambar) dan \`alt\` (teks deskripsi cadangan jika gambar gagal dimuat).
\`\`\`html
<img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8" alt="Developer Desk" />
\`\`\`

### 5. Input Text: \`<input>\`
Digunakan untuk menerima data masukan dari pengguna (seperti mengisi form pendaftaran). Memiliki atribut \`type\` (seperti \`"text"\`, \`"password"\`, \`"email"\`) dan \`placeholder\` (petunjuk samar di dalam kotak).
\`\`\`html
<input type="text" placeholder="Masukkan nama Anda..." />
\`\`\`

---

## Referensi & Kutipan
1. **MDN Web Docs:** [HTML Basics Guide](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics)
2. **W3Schools:** [HTML Introduction & Tag List](https://www.w3schools.com/html/html_intro.asp)

---

## Tantangan Praktik Mandiri
Untuk memastikan Anda memahami cara kerja tag di atas, selesaikan tantangan di panel sebelah kanan:
Tulis kode HTML yang menampilkan kartu profil sederhana berisi judul nama Anda (\`<h1>\`), biografi singkat (\`<p>\`), gambar (\`<img>\`), input komentar (\`<input>\`), dan tombol submit (\`<button>\`).
      `
    });

    // CSS Modern
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "css-modern",
      title: "CSS Modern: Menghias Robot dengan Baju Keren",
      slug: "css-modern-menghias-robot",
      content: `
# Cat & Baju Keren Robotmu: CSS!

Robot kita sekarang sudah memiliki kerangka tulang yang kuat (HTML), tapi dia terlihat menyeramkan karena hanya berupa besi-besi kosong. Mari kita beri dia baju besi yang mengkilap, warna mata yang bercahaya, dan tata letak pelindung yang gagah menggunakan **CSS (Cascading Style Sheets)**!

### 📐 Grid & Layouting Modern
Dahulu kala, para developer harus menggunakan kalkulator untuk membagi lebar kotak agar pas di layar. Sekarang kita punya teknologi ajaib bernama **CSS Grid** dan **Flexbox**!

*   **Flexbox** itu seperti antrean anak-anak di depan kantin. Mereka bisa berbaris menyamping (baris) atau berbaris ke bawah (kolom) dengan sangat rapi dan fleksibel.
*   **CSS Grid** itu seperti papan catur raksasa. Kamu bisa menentukan bidak robotmu diletakkan di koordinat kotak mana pun dengan sangat mudah!

Yuk, coba jawab kuis di panel kanan untuk mengetes apakah otak robotmu sudah memahami konsep styling modern ini!
      `
    });

    // JS Modern
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "js-modern",
      title: "JavaScript (ES2026): Memberi Kabel Otak & Baterai",
      slug: "javascript-memberi-otak-robot",
      content: `
# Bip-Bop! Mari Hidupkan Robot Kita dengan JavaScript!

Luar biasa! Robot kita sudah berkerangka kuat (HTML) dan berbaju perang indigo mengkilap (CSS). Tapi dia diam membisu seperti patung lilin. 
Untuk membuatnya bisa menari saat tombol dipencet, atau berhitung matematika dengan super cepat, kita harus memasangkan **kabel saraf dan baterai pintar** padanya. Pustaka otak ini dinamakan **JavaScript**!

### Konsep Asynchronous (Tidak Saling Menghalangi)
Bayangkan kamu menyuruh robotmu untuk:
1. Memasak nasi (butuh waktu 30 menit).
2. Menyapu lantai (butuh waktu 5 menit).

Jika robotmu bekerja secara **Synchronous** (antre satu per satu), dia akan berdiri diam menatap penanak nasi selama 30 menit, baru setelah itu mulai menyapu lantai. Sungguh tidak pintar!
Dengan **Asynchronous (Async/Await)**, robotmu akan menekan tombol masak nasi, lalu selagi nasi matang, dia langsung pergi menyapu lantai! 

Mari kita latih logika JavaScript-mu di panel kanan dengan membuat fungsi matematika sederhana!
      `
    });

    // Git & GitHub
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "git-github",
      title: "Git & GitHub: Tombol Save Game untuk Coder",
      slug: "git-github-save-game",
      content: `
# Jangan Takut Salah: Tombol Save Game Git!

Pernahkah kamu bermain game RPG dan takut kalah saat melawan bos naga raksasa? Apa yang kamu lakukan sebelum masuk ke sarang naga? Ya, menekan tombol **Save Game**! Jadi, jika karaktermu kalah, kamu bisa *reload* dan kembali ke detik sebelum kamu kalah.

Dalam dunia coding, **Git adalah mesin waktu Save Game** kita!
*   **Git** merekam setiap baris kode yang kamu tulis. Jika besok kodedu rusak dan berantakan, kamu tinggal putar waktu ke hari kemarin saat kodemu masih berjalan normal!
*   **GitHub** adalah awan (cloud) tempat kita memamerkan dan menyimpan file *Save Game* kita secara online agar bisa berkolaborasi dengan developer lain di seluruh dunia.
      `
    });

    // Next.js & React 19
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "nextjs-react",
      title: "Next.js & React 19: Pabrik Pasukan Robot Super Cepat",
      slug: "nextjs-react-pabrik-robot",
      content: `
# Next.js & React 19: Membuat Pasukan Aplikasi Raksasa

Kamu sudah mahir membuat satu halaman robot. Tapi bagaimana jika klien memintamu membuat 10.000 halaman robot yang saling terhubung (seperti Tokopedia atau Facebook)? Jika kamu menulisnya satu per satu secara manual, kamu akan sangat kelelahan!

**React** membantu kita membagi halaman web menjadi potongan-potongan lego kecil bernama **Components** (misalnya komponen KartuProduk, tombol Beli, dll.) yang bisa kita pakai ulang ribuan kali.

**Next.js** bertindak sebagai pabrik raksasa yang merender lego-lego tersebut di server terlebih dahulu sebelum dikirimkan ke HP pengguna, menjadikannya super cepat saat dimuat pertama kali!
      `
    });

    // Tailwind CSS v4 & shadcn
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "tailwind-v4",
      title: "Tailwind CSS v4 & shadcn/ui: Mewarnai Secepat Kilat",
      slug: "tailwind-v4-dan-shadcn",
      content: `
# Tailwind CSS v4: Menghias Tanpa Bolak-Balik Lemari Cat!

Menulis CSS manual terkadang melelahkan karena kita harus membuat file terpisah, memberi nama class yang rumit, lalu bolak-balik menghubungkannya ke HTML.

**Tailwind CSS** adalah kantong ajaib Doraemon! Kamu cukup menempelkan utility class (contoh: \`bg-primary text-white p-4 rounded\`) langsung di dalam elemen HTML-mu. 
Versi **v4** yang baru di tahun 2026 ini berjalan super cepat karena langsung dikompilasi oleh compiler canggih berbasis Rust!

Dan **shadcn/ui** memberikan kita komponen-komponen siap pakai premium (seperti modal dialog, form input, dll.) yang kodenya bisa langsung kita salin ke proyek kita.
      `
    });

    // Node.js & Express
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "nodejs-express",
      title: "Node.js & Express: Dapur Rahasia Server",
      slug: "nodejs-express-dapur-server",
      content: `
# Node.js & Express: Memasak Data di Dapur Belakang

Saat kamu memesan makanan di restoran mewah, kamu duduk manis di meja makan (Frontend/Browser). Kamu tidak melihat koki memotong sayur, merebus kuah, dan mencuci piring di dapur belakang (Backend/Server).

*   **Node.js** adalah mesin kompor super bertenaga yang menjalankan JavaScript langsung di komputer server (bukan di browser user).
*   **Express** adalah buku resep masakan yang mengatur pesanan (Route/Request) dari pelanggan. Jika pelanggan memesan \`GET /makanan\`, Express bertugas menyajikan hidangan data masakan dari gudang database ke meja makan browser pelanggan.
      `
    });

    // Databases (SQL & NoSQL)
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "databases-sql-nosql",
      title: "Databases: Gudang Penyimpanan Memori Robot",
      slug: "databases-penyimpanan-memori",
      content: `
# Databases: Tempat Aman Menyimpan Harta Karun Data!

Robot pintar kita butuh tempat untuk mencatat daftar nama siswa, nilai kuis mereka, dan sandi rahasia mereka agar tidak hilang saat listrik padam. Tempat penyimpanan ini dinamakan **Database (Basis Data)**.

Secara umum, gudang penyimpanan database dibagi dua tipe:
1.  **SQL (Relasional seperti PostgreSQL / MySQL):** Seperti lemari arsip kantor yang super rapi dengan laci-laci tabel yang terhubung satu sama lain menggunakan kunci (*Key*).
2.  **NoSQL (Non-Relasional seperti MongoDB):** Seperti kontainer mainan anak-anak. Kamu bisa memasukkan data dalam format dokumen JSON fleksibel tanpa struktur kolom yang kaku.
      `
    });

    // VPS Setup & Docker
    await Material.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "vps-docker",
      title: "VPS & Docker: Menerbangkan Robot ke Luar Angkasa",
      slug: "vps-docker-deployment",
      content: `
# VPS & Docker: Lepaskan Aplikasi ke Seluruh Dunia!

Keren sekali! Robot website kita sudah jadi dan bekerja dengan baik di komputer lokal kita (localhost). Tapi tentu saja teman-temanmu di kota lain belum bisa mengaksesnya. Kita perlu menyewa **komputer online 24 jam** yang terletak di pusat data Google/Amazon. Komputer ini dinamakan **VPS (Virtual Private Server)**.

Agar website kita berjalan dengan lancar tanpa ada keluhan *"Tapi di laptop saya jalannya normal kok!"*, kita membungkus aplikasi kita menggunakan wadah kontainer khusus bernama **Docker**. Docker memastikan aplikasi kita berjalan sama persis di komputer mana pun di seluruh penjuru dunia!
      `
    });


    // --- B. UI/UX DESIGNER ROADMAP MATERIALS ---
    await Material.create({
      roadmapId: uiuxRoadmap._id,
      nodeId: "figma-basics",
      title: "Figma & Auto Layout Dasar",
      slug: "figma-basics-auto-layout",
      content: `
# Figma: Kanvas Lukis Digital Desainer

Sebelum kita membuat kode, kita wajib merancang bentuk visual aplikasi kita agar tidak membuang-buang waktu coding. Aplikasi standar industri untuk menggambar desain web ini bernama **Figma**.

### Apa itu Auto Layout?
Auto layout adalah salah satu fitur paling revolusioner di Figma. Dia bekerja mirip Flexbox pada CSS. Jika kamu menambah teks di dalam tombol, tombol tersebut akan otomatis melebar dengan padding yang pas secara otomatis tanpa perlu kamu geser ukurannya secara manual!
      `
    });


    // --- C. AI-POWERED ROADMAP MATERIALS ---
    await Material.create({
      roadmapId: aidevRoadmap._id,
      nodeId: "ai-editors-setup",
      title: "Cursor & Windsurf Setup Asisten Coding AI",
      slug: "ai-editors-setup-guide",
      content: `
# Cursor & Windsurf: Editor Kode Masa Depan

Selamat datang di era AI! Di tahun 2026, developer yang sukses bukanlah yang menulis semua kode dari nol secara manual, melainkan mereka yang mampu memimpin agen AI untuk menuliskan kode bagi mereka.

**Cursor** dan **Windsurf** adalah editor kode modifikasi dari VS Code yang memiliki integrasi kecerdasan buatan super mendalam. 
Mereka bisa membaca seluruh isi folder proyekmu, mendeteksi error kompilasi secara instan, dan membenarkannya secara otonom saat kamu menekan tombol chat.
      `
    });


    // ==========================================
    // 5. SEED QUIZZES & CHALLENGES FOR PHASE 1
    // ==========================================

    // HTML challenge
    await CodeChallenge.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "html-modern",
      title: "Membuat Kartu Profil Sederhana",
      description: `
Tulis kode HTML lengkap untuk membuat kartu profil sederhana di dalam \`<div>\` pembungkus:
1. Satu tag \`<h1>\` untuk nama Anda (contoh: \`John Doe\`).
2. Satu tag \`<p>\` untuk biografi singkat Anda.
3. Satu tag \`<img>\` untuk menampilkan foto profil (gunakan source \`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde\`).
4. Satu tag \`<input>\` dengan \`type="text"\` dan \`placeholder="Kirim pesan..."\`.
5. Satu tag \`<button>\` untuk mengirimkan pesan.
      `,
      language: "html",
      initialCode: `<div>
  <!-- Tulis kode elemen HTML profil Anda di bawah ini -->
  
</div>`,
      testCases: [
        {
          inputDescription: "Memiliki elemen h1",
          assertionCode: "doc.querySelector('h1') !== null",
          expectedOutput: "True",
        },
        {
          inputDescription: "Memiliki elemen p",
          assertionCode: "doc.querySelector('p') !== null",
          expectedOutput: "True",
        },
        {
          inputDescription: "Memiliki elemen img dengan src valid",
          assertionCode: "doc.querySelector('img')?.getAttribute('src') !== null",
          expectedOutput: "True",
        },
        {
          inputDescription: "Memiliki elemen input text",
          assertionCode: "doc.querySelector('input[type=\"text\"]') !== null",
          expectedOutput: "True",
        },
        {
          inputDescription: "Memiliki elemen button",
          assertionCode: "doc.querySelector('button') !== null",
          expectedOutput: "True",
        }
      ]
    });

    // CSS Quiz
    await Quiz.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "css-modern",
      title: "Uji Pemahaman CSS Modern",
      timeLimit: 120,
      questions: [
        {
          id: "css-q1",
          questionText: "Fitur CSS manakah yang bertindak seperti papan catur dua dimensi untuk mengatur tata letak?",
          options: ["Float", "CSS Grid", "Inline-block", "Relative Position"],
          correctOptionIndex: 1,
          explanation: "CSS Grid mempermudah kita mendesain layout dua dimensi (baris dan kolom) sekaligus dengan presisi tinggi.",
        },
        {
          id: "css-q2",
          questionText: "Apa keunggulan Flexbox dibanding CSS Grid?",
          options: [
            "Flexbox berfokus pada layout satu arah (satu dimensi) baik mendatar atau menurun saja.",
            "Flexbox lebih lambat dimuat.",
            "Flexbox hanya berfungsi untuk gambar.",
            "Flexbox tidak didukung oleh browser modern."
          ],
          correctOptionIndex: 0,
          explanation: "Flexbox (Flexible Box Layout) paling cocok untuk tata letak satu dimensi (mendatar atau menurun saja)."
        }
      ]
    });

    // JS Challenge
    await CodeChallenge.create({
      roadmapId: webdevRoadmap._id,
      nodeId: "js-modern",
      title: "Tantangan JavaScript: Hitung Nilai Kuadrat",
      description: `
Buatlah sebuah fungsi bernama \`hitungKuadrat(num)\` yang menerima satu parameter berupa angka, dan mengembalikan hasil kuadrat dari angka tersebut.

Fungsi harus terdefinisi dengan benar di lingkup global workspace.
      `,
      language: "javascript",
      initialCode: `function hitungKuadrat(num) {
  // Tulis kode solusi Anda di bawah ini
  
}`,
      testCases: [
        {
          inputDescription: "Fungsi hitungKuadrat terdefinisi",
          assertionCode: "typeof hitungKuadrat === 'function'",
          expectedOutput: "True",
        },
        {
          inputDescription: "hitungKuadrat(4) mengembalikan 16",
          assertionCode: "hitungKuadrat(4) === 16",
          expectedOutput: "16",
        },
        {
          inputDescription: "hitungKuadrat(-3) mengembalikan 9",
          assertionCode: "hitungKuadrat(-3) === 9",
          expectedOutput: "9",
        }
      ]
    });


    // ==========================================
    // 6. LINK EXERCISES TO MATERIALS
    // ==========================================
    const htmlMat = await Material.findOne({ roadmapId: webdevRoadmap._id, nodeId: "html-modern" });
    const htmlChallenge = await CodeChallenge.findOne({ roadmapId: webdevRoadmap._id, nodeId: "html-modern" });
    if (htmlMat && htmlChallenge) {
      htmlMat.challengeId = htmlChallenge._id;
      await htmlMat.save();
    }

    const cssMat = await Material.findOne({ roadmapId: webdevRoadmap._id, nodeId: "css-modern" });
    const cssQuiz = await Quiz.findOne({ roadmapId: webdevRoadmap._id, nodeId: "css-modern" });
    if (cssMat && cssQuiz) {
      cssMat.quizId = cssQuiz._id;
      await cssMat.save();
    }

    const jsMat = await Material.findOne({ roadmapId: webdevRoadmap._id, nodeId: "js-modern" });
    const jsChallenge = await CodeChallenge.findOne({ roadmapId: webdevRoadmap._id, nodeId: "js-modern" });
    if (jsMat && jsChallenge) {
      jsMat.challengeId = jsChallenge._id;
      await jsMat.save();
    }

    return NextResponse.json({
      success: true,
      message: "Database successfully populated with 8 roadmaps and expanded fun Indonesian materials!",
      accounts: {
        superadmin: "superadmin@devroadmap.com / superadmin123",
        partner: "partner@devroadmap.com / partner123",
      },
    });
  } catch (error: any) {
    console.error("Seeding database error:", error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
