# PantauBola ⚽🤖

PantauBola adalah platform analitik, prediksi, dan simulasi pertandingan sepak bola berbasis AI. Menggabungkan model distribusi probabilitas statistik Poisson dengan kecerdasan buatan (Large Language Model) dari Google Gemini, platform ini menyajikan statistik sepak bola yang mendalam, prediktor skor yang andal, dan klasemen liga waktu nyata (real-time).

---

## 🚀 Fitur Utama

1. **AI Match Predictions & Tactical Analysis**:
   - Memprediksi probabilitas hasil tanding (1X2) menggunakan model matematika Poisson.
   - Menyajikan ulasan taktis AI dinamis (analysis text) dan faktor kunci kemenangan tim yang dievaluasi oleh Google Gemini.

2. **Interactive AI Simulator**:
   - Simulator interaktif client-side berbasis distribusi Poisson. User dapat memanipulasi variabel *Expected Goals* (xG) tim kandang dan tandang melalui slider untuk melihat probabilitas hasil secara real-time.
   - Integrasi otomatis dengan data riil rata-rata gol dan xG historis tim dari database Supabase.

3. **Next.js Server Components (SSR) Standings**:
   - Halaman klasemen liga di-render murni dari sisi server (SSR) menggunakan routing parameter URL (`?league=PL`) untuk loading cepat dan optimasi SEO.
   - Dilengkapi visualisasi **Tren Form Streak** (5 Laga Terakhir) yang dihitung secara dinamis dari database pertandingan.

4. **Dynamic Stats & Head-to-Head (H2H)**:
   - Panel visualisasi data perbandingan taktis klub menggunakan grafik Recharts.
   - Riwayat H2H dinamis yang menampilkan skor, tanggal, dan logo klub dari 5 pertemuan terakhir.
   - AI Accuracy Tracker real-time dan Goal Rate Liga yang dihitung dari total laga teranalisis di database.

---

## 🛠️ Tech Stack

### Frontend (Web Client)

- **Framework**: Next.js 15+ (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS v4
- **Visualisasi**: Recharts (Chart) & SVG progress ring
- **Database Client**: Supabase JS Client

### Backend / Data Pipeline (Python)

- **Bahasa**: Python 3.10+
- **Database/ORM**: Supabase Python Client
- **AI SDK**: Google GenAI SDK (Gemini cascading models)
- **API Data**: Football-Data.org API

---

## 📂 Struktur Repositori

```text
PantauBola/
├── .agent/              # Konfigurasi agen AI pair programming
├── database/            # Skema DDL tabel database Supabase
├── pipeline/            # Skema pengolahan data & pipeline prediksi (Python)
│   ├── football_api.py  # Modul integrasi Football-Data API & rate limit handler
│   ├── gemini.py        # Modul integrasi Gemini AI (Cascading model fallback)
│   ├── test_gemini.py   # Unit test mock model fallback Gemini
│   └── test_poisson.py  # Unit test kalkulator Poisson
├── web/                 # Aplikasi frontend Next.js
│   ├── src/
│   │   ├── app/         # Pages (home, standings, matches, simulator)
│   │   ├── components/  # Shared components (Footer, dll.)
│   │   └── lib/         # Supabase client & mock data
└── README.md            # Dokumentasi utama proyek
```

---

## 💻 Panduan Setup & Instalasi Lokal

### 1. Prasyarat (Prerequisites)

- Node.js v18+ dan npm
- Python v3.10+
- Akun Supabase (untuk database)
- API Keys untuk Gemini API dan Football-Data.org

### 2. Konfigurasi Environment Variables (`.env`)

Salin berkas contoh konfigurasi `.env.example` ke direktori proyek masing-masing:

- **Root & Pipeline (`.env`)**:

  ```bash
  cp .env.example .env
  # Isi SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, dan FOOTBALL_API_KEY
  ```

- **Web Frontend (`web/.env`)**:

  ```bash
  # Salin config publik di folder web
  # Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
  ```

### 3. Setup Backend & Pipeline (Python)

1. Buat dan aktifkan virtual environment lokal:

   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

2. Instal dependensi pipeline:

   ```bash
   pip install -r pipeline/requirements.txt
   ```

3. Jalankan pipeline pengumpulan data dan prediksi:

   ```bash
   python pipeline/main.py
   ```

### 4. Setup Frontend (Next.js)

1. Pindah ke direktori frontend:

   ```bash
   cd web
   ```

2. Instal dependensi frontend:

   ```bash
   npm install
   ```

3. Jalankan server development lokal:

   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🧪 Pengujian & Penjaminan Mutu

### Menjalankan Unit Test Python (Pipeline)

Gunakan python interpreter dari virtual environment lokal untuk memverifikasi model Poisson dan Gemini cascade fallback:

```bash
# Windows
.\venv\Scripts\python.exe -m unittest pipeline/test_poisson.py
.\venv\Scripts\python.exe -m unittest pipeline/test_gemini.py

# macOS/Linux
./venv/bin/python -m unittest pipeline/test_poisson.py
./venv/bin/python -m unittest pipeline/test_gemini.py
```

### Menjalankan Linter Frontend (Next.js)

Jalankan ESLint di direktori frontend untuk memastikan keselarasan format dan kode bersih dari warnings/errors:

```bash
cd web
npm run lint
```

---

## 🛡️ Arsitektur Stabilitas Sistem

1. **Cascading Gemini Model Fallback** (`pipeline/gemini.py`):
   Sistem secara otomatis mendeteksi kegagalan API Gemini (seperti kehabisan kuota HTTP 429 atau server error). Jika model utama `gemini-2.5-flash` gagal, pipeline akan mencoba model cadangan `gemini-1.5-flash` sebelum jatuh kembali ke analisis statistik default agar data prediksi tetap tersedia.

2. **Iterative Exponential Backoff Rate Limiting** (`pipeline/football_api.py`):
   Modul API Football-Data dilengkapi pengamanan rate-limiting (HTTP 429) menggunakan algoritma loop iteratif dengan delay bertingkat (`30s * retries`), memastikan pipeline pengumpulan data tidak crash saat melakukan sinkronisasi masif.

3. **Hydration Prevention React**:
   Seluruh chart Recharts di frontend menggunakan flag `mounted` client-side rendering dinamis untuk mencegah inkonsistensi layout (hydration mismatch) saat rendering server-side Next.js.

---

## 🌐 Panduan Deployment ke Cloudflare Pages

Aplikasi Next.js PantauBola dirancang agar dapat di-deploy dengan mudah ke **Cloudflare Pages** menggunakan adapter `@cloudflare/next-on-pages` untuk mendukung Server-Side Rendering (SSR) secara penuh pada Edge Runtime Cloudflare.

### Langkah-langkah Deployment

1. **Konfigurasi Edge Runtime**:
   Untuk halaman dynamic SSR seperti `standings` dan `matches/[id]`, tambahkan ekspor runtime berikut di file halaman terkait jika ingin dijalankan di edge worker Cloudflare:

   ```typescript
   export const runtime = 'edge';
   ```

2. **Build Configuration**:
   Di dashboard Cloudflare Pages, atur preset build sebagai **Next.js (v13+)** dengan command:

   ```bash
   npx @cloudflare/next-on-pages
   ```

3. **Environment Variables**:
   Pastikan variabel lingkungan publik berikut disetel di dashboard Cloudflare Pages Settings -> Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
