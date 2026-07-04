# PLAN-pantaubola-mvp.md

## Overview
**PantauBola** adalah platform analitik dan pelacak data sepak bola Eropa. Proyek ini menggunakan arsitektur terpisah (*polyglot architecture*):
1. **Python Data Pipeline**: Mengambil data dari [Football-Data.org](https://www.football-data.org/), menghitung probabilitas hasil pertandingan menggunakan Distribusi Poisson, memanggil Gemini API (cascade: `gemini-3.5-flash` → `gemini-2.5-pro` → `gemini-3.1-flash-lite`) dalam mode JSON terstruktur untuk ulasan taktis, dan menyimpan hasilnya ke Supabase.
2. **Supabase Database**: Menyimpan data tabel `teams`, `matches`, `standings`, dan `ai_predictions` dengan keamanan Row Level Security (RLS) diaktifkan.
3. **Next.js Web Frontend**: Dashboard modern (TypeScript & Tailwind) yang menyajikan klasemen, jadwal pertandingan, visualisasi data grafik interaktif, dan ulasan taktis AI.

Pipeline data berjalan otomatis menggunakan **GitHub Actions** terjadwal 2 kali seminggu (Senin malam/Selasa pagi & Jumat pagi) untuk menghindari data basi (*stale*).

---

## Project Type
- **WEB** & **BACKEND (Data Pipeline)**
- **Primary Agents**: `database-architect`, `backend-specialist`, `frontend-specialist`

---

## Success Criteria
1. Skrip Python berhasil menarik klasemen, tim, dan jadwal dari Football-Data.org tanpa eror rate limit.
2. Skrip Python berhasil memproses Poisson, memanggil Gemini API, dan menyimpan data prediksi ke Supabase.
3. GitHub Actions berjalan secara terjadwal 2 kali seminggu dengan sukses.
4. Dashboard Next.js menampilkan klasemen terkini, daftar pertandingan dengan persentase prediksi, serta halaman detail pertandingan dengan radar/bar chart dan analisis AI.
5. Keamanan RLS di database aktif; client-side hanya menggunakan SELECT via Public Anon Key.
6. Lolos semua audit performa (Lighthouse) dan lolos audit UX (bebas warna ungu/violet dominan dan layout template generik).

---

## Tech Stack
- **Database**: Supabase (PostgreSQL)
- **Data Pipeline**: Python 3.10+, libraries (`requests`, `google-genai`, `supabase-py`, `pandas`, `scipy`)
- **Pipeline Runner**: GitHub Actions (Scheduler)
- **Web App**: Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts (visualisasi chart)

---

## File Structure

```text
PantauBola/
├── .agent/                  # Konfigurasi AI Agent & Skills
├── .github/
│   └── workflows/
│       └── data-pipeline.yml# GitHub Actions cron scheduler
├── database/
│   └── schema.sql           # Skrip SQL inisialisasi Supabase
├── pipeline/                # Python Worker
│   ├── requirements.txt     # Dependensi Python
│   ├── config.py            # Konfigurasi env & konstanta
│   ├── poisson.py           # Logika kalkulasi Distribusi Poisson
│   ├── gemini.py            # Integrasi Gemini API (JSON Mode)
│   ├── supabase_db.py       # Operasi database client (CRUD)
│   └── main.py              # Entry point pipeline scheduler
├── web/                     # Next.js Frontend
│   ├── public/              # Logo & aset statis
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css  # CSS-first Tailwind v4 config
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx     # Landing page / Home
│   │   │   ├── standings/   # Halaman Klasemen Liga
│   │   │   │   └── page.tsx
│   │   │   └── matches/
│   │   │       ├── page.tsx # Daftar Laga (Matchday view)
│   │   │       └── [id]/    # Detail Match, Chart, AI Review
│   │   │           └── page.tsx
│   │   ├── components/      # UI Components (Chart, MatchCard, StandingsTable)
│   │   │   ├── ui/
│   │   │   └── match-detail/
│   │   ├── lib/
│   │   │   └── supabase.ts  # Supabase client (Anon)
│   │   └── types/
│   │       └── index.ts     # TypeScript Definitions
│   └── package.json
└── docs/
    └── PLAN-pantaubola-mvp.md # Dokumen Rencana Implementasi
```

---

## Database Schema Update

```sql
-- 1. Membuat Tabel Teams (Klub)
CREATE TABLE teams (
    id INT PRIMARY KEY, -- Gunakan ID asli dari Football-Data.org untuk sinkronisasi mudah
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    league VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Membuat Tabel Standings (Klasemen Liga)
CREATE TABLE standings (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    league VARCHAR(50) NOT NULL,
    position SMALLINT NOT NULL,
    played SMALLINT DEFAULT 0,
    won SMALLINT DEFAULT 0,
    drawn SMALLINT DEFAULT 0,
    lost SMALLINT DEFAULT 0,
    goals_for SMALLINT DEFAULT 0,
    goals_against SMALLINT DEFAULT 0,
    points SMALLINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Membuat Tabel Matches (Pertandingan)
CREATE TABLE matches (
    id INT PRIMARY KEY, -- Gunakan ID asli dari Football-Data.org
    home_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_score SMALLINT,
    away_score SMALLINT,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, FINISHED
    league VARCHAR(50) NOT NULL,
    matchday SMALLINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Membuat Tabel AI_Predictions (Hasil Kalkulasi & Teks Gemini)
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
    home_prob NUMERIC(5,2), -- Persentase (e.g. 65.50)
    draw_prob NUMERIC(5,2),
    away_prob NUMERIC(5,2),
    predicted_home_score SMALLINT,
    predicted_away_score SMALLINT,
    analysis_text TEXT,
    key_factors TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ai_predictions" ON ai_predictions FOR SELECT USING (true);
```

---

## Task Breakdown

### Phase 1: Database Setup & Security (P0)

#### Task 1.1: Inisialisasi Supabase Database Schema
- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **Dependencies**: None
- **Description**: Menjalankan SQL script untuk membuat tabel `teams`, `standings`, `matches`, dan `ai_predictions` di Supabase SQL Editor.
- **INPUT**: Schema SQL
- **OUTPUT**: Tabel terbuat di Supabase
- **VERIFY**: Cek status skema tabel di Supabase Dashboard.

#### Task 1.2: Konfigurasi Row Level Security (RLS)
- **Agent**: `security-auditor`
- **Skill**: `vulnerability-scanner`
- **Priority**: P0
- **Dependencies**: Task 1.1
- **Description**: Mengaktifkan RLS pada seluruh tabel dan membuat kebijakan SELECT untuk akses publik (Anon Key).
- **INPUT**: Script kebijakan RLS
- **OUTPUT**: RLS aktif dengan kebijakan SELECT publik
- **VERIFY**: Uji coba query SELECT menggunakan anon key berhasil, query INSERT/UPDATE/DELETE dari client ditolak.

---

### Phase 2: Python Data Pipeline Implementation (P1)

#### Task 2.1: Python API Integrator (Football-Data.org)
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Task 1.2
- **Description**: Membuat modul `pipeline/supabase_db.py` dan `pipeline/main.py` untuk mengunduh klasemen liga (standings), tim (teams), dan jadwal pertandingan (matches) terdekat dari Football-Data.org.
- **INPUT**: API Key Football-Data.org & Supabase credentials
- **OUTPUT**: Modul sinkronisasi data tim, klasemen, dan jadwal pertandingan
- **VERIFY**: Jalankan pengujian script lokal, pastikan data tersimpan di tabel `teams`, `standings`, dan `matches`.

#### Task 2.2: Logika Poisson Distribution
- **Agent**: `backend-specialist`
- **Skill**: `python-patterns`
- **Priority**: P1
- **Dependencies**: Task 2.1
- **Description**: Membuat modul `pipeline/poisson.py` untuk menghitung probabilitas hasil tanding (1X2) dan ekspektasi skor tim berdasarkan data rata-rata gol kandang/tandang liga dan performa 5 laga terakhir.
- **INPUT**: Data tim dan klasemen dari database
- **OUTPUT**: Output angka probabilitas menang, seri, kalah, dan prediksi skor kasar
- **VERIFY**: Uji modul dengan input 2 tim, pastikan total probabilitas 1X2 = 100%.

#### Task 2.3: Integrasi Gemini API (Structured Output)
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **Priority**: P1
- **Dependencies**: Task 2.2
- **Description**: Membuat modul `pipeline/gemini.py` untuk memicu ulasan AI menggunakan prompt taktis sepak bola Indonesia, menyuplai statistik dasar + hasil Poisson, dan meminta balasan dalam bentuk JSON terstruktur sesuai schema PRD.
- **INPUT**: Data statistik tim + hasil Poisson
- **OUTPUT**: JSON berisi prediksi skor, ulasan analisis taktis, dan faktor kunci
- **VERIFY**: Panggil Gemini API dengan parameter testing, verifikasi JSON valid dan tidak ada pembuka/penutup basa-basi.

#### Task 2.4: Integrasi Akhir Pipeline & Database Writer
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **Priority**: P1
- **Dependencies**: Task 2.3
- **Description**: Menyambungkan output Poisson dan Gemini, lalu menyimpannya ke tabel `ai_predictions` dengan bypass RLS menggunakan Supabase Service Role Key.
- **INPUT**: Data prediksi lengkap (Poisson + Gemini)
- **OUTPUT**: Pipeline utama selesai
- **VERIFY**: Jalankan pipeline utuh untuk 1 matchday, pastikan tabel `ai_predictions` terisi lengkap.

#### Task 2.5: GitHub Actions Cron Scheduler (Solusi A)
- **Agent**: `devops-engineer`
- **Skill**: `bash-linux`
- **Priority**: P1
- **Dependencies**: Task 2.4
- **Description**: Membuat file `.github/workflows/data-pipeline.yml` yang berjalan otomatis terjadwal (Senin malam/Selasa pagi & Jumat pagi) untuk memperbarui data skor dan prediksi mendatang.
- **INPUT**: Konfigurasi GitHub Secrets & Cron expression
- **OUTPUT**: `.github/workflows/data-pipeline.yml`
- **VERIFY**: Jalankan pemicu manual (*workflow_dispatch*) di GitHub Actions untuk memastikan workflow sukses mengeksekusi script Python.

---

### Phase 3: Frontend Next.js Dashboard (P2)

#### Task 3.1: Setup Next.js & Supabase Client Integration
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **Priority**: P2
- **Dependencies**: Task 1.2
- **Description**: Menginisialisasi proyek Next.js, mengonfigurasi Tailwind CSS v4, dan membuat utility Supabase client menggunakan Anon Key.
- **INPUT**: Next.js Boilerplate
- **OUTPUT**: Setup dasar Next.js terintegrasi Supabase
- **VERIFY**: Build aplikasi lokal sukses, halaman index awal berhasil di-render.

#### Task 3.2: Implementasi Halaman Klasemen (Standings Page)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 3.1
- **Description**: Membuat halaman `/standings` untuk memvisualisasikan klasemen tim per liga dari tabel `standings` lokal dengan filter liga.
- **INPUT**: Data standings dari DB
- **OUTPUT**: UI tabel klasemen yang responsif dan interaktif
- **VERIFY**: Buka halaman standings di browser, pastikan posisi tim terurut dengan benar dari peringkat 1 hingga terbawah.

#### Task 3.3: Halaman Fixtures / Jadwal Pertandingan (Matches Page)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 3.2
- **Description**: Membuat halaman `/matches` (atau di main dashboard) untuk menampilkan jadwal pertandingan terdekat dan hasil pertandingan terakhir. Menyertakan *badge* persentase prediksi 1X2 dari tabel `ai_predictions`.
- **INPUT**: Data matches joined dengan teams dan ai_predictions
- **OUTPUT**: Grid jadwal pertandingan responsif
- **VERIFY**: Halaman menampilkan status laga (Scheduled / Finished) beserta skor asli atau badge persentase prediksi.

#### Task 3.4: Halaman Detail & Visualisasi Grafik (Match Detail Page)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 3.3
- **Description**: Membuat halaman dinamis `/matches/[id]` untuk menampilkan perbandingan statistik head-to-head kedua tim (radar chart/bar chart menggunakan Recharts) dan menampilkan ulasan taktis AI dari Gemini.
- **INPUT**: ID Pertandingan
- **OUTPUT**: Detail visual analisis taktis premium
- **VERIFY**: Buka salah satu match detail, pastikan grafik performa digambar dengan benar dan analisis teks Gemini ter-render dengan rapi.

---

### Phase 4: Polish & Verification (P3)

#### Task 4.1: UI/UX Audit & Optimization
- **Agent**: `frontend-specialist`
- **Skill**: `web-design-guidelines`
- **Priority**: P3
- **Dependencies**: Task 3.4
- **Description**: Memastikan kepatuhan aturan UI/UX (tidak ada hex code ungu/violet dominan, font premium Outfit/Inter, animasi transisi halus, mobile-first responsif).
- **INPUT**: Next.js frontend code
- **OUTPUT**: Dashboard teroptimasi secara visual
- **VERIFY**: Uji responsivitas di ukuran layar mobile (375px) dan desktop (1440px).

#### Task 4.2: Audit Keamanan & Kinerja Akhir
- **Agent**: `security-auditor` & `performance-optimizer`
- **Skill**: `vulnerability-scanner` & `performance-profiling`
- **Priority**: P3
- **Dependencies**: Task 4.1
- **Description**: Menjalankan scan keamanan file dan Lighthouse performance audit untuk memastikan performa yang cepat dan bebas dari kebocoran token database (*Service Role Key*).
- **INPUT**: Full Codebase
- **OUTPUT**: Laporan lolos verifikasi akhir
- **VERIFY**: Jalankan `verify_all.py` dan verifikasi tidak ada Service Role Key yang bocor ke repository publik/frontend client.

---

## Phase X: Verification Checklist

### 1. Automated Scripts
Jalankan verifikasi internal:
```powershell
python .agent/scripts/verify_all.py . --url http://localhost:3000
```
- P0: Security Scan -> Harus bebas dari vulnerability dan hardcoded secrets.
- P1: UX Audit -> Responsif, tidak ada kontras buruk, tidak melanggar aturan warna ungu.
- P2: Lighthouse Audit -> Nilai performa & SEO minimal 90.

### 2. Manual Verification Checklist
- [ ] Buka browser dan pastikan tabel klasemen (`/standings`) sesuai dengan kompetisi Eropa asli.
- [ ] Klik salah satu pertandingan terjadwal, periksa apakah persentase Poisson (Home Win, Draw, Away Win) masuk akal dan berjumlah 100%.
- [ ] Periksa analisis Gemini API di halaman detail apakah menggunakan bahasa Indonesia kasual gaul bola (seperti "on-fire", "clean sheet").
- [ ] Cek file `.github/workflows/data-pipeline.yml` apakah cron disetel sesuai **Solusi A** (Senin malam & Jumat pagi).

### 3. Rule Compliance
- [ ] Bebas warna dominan Ungu/Violet (Purple Ban).
- [ ] Desain premium dan orisinal, bukan hasil copy template generik.
- [ ] Socratic Gate terpenuhi dan disetujui pengguna.
