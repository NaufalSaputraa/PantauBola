# run_project.ps1
# Script Otomatisasi untuk Menjalankan PantauBola (Database, Python Pipeline, & Next.js)

Clear-Host
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '                PANTAUBOLA SETUP & RUNNER                  ' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

# 1. Cek File .env
if (-not (Test-Path '.env')) {
    Write-Host '[!] Error: File .env tidak ditemukan!' -ForegroundColor Red
    Write-Host 'Silakan buat file .env di root folder terlebih dahulu dan isi konfigurasi API & Supabase.' -ForegroundColor Yellow
    Exit 1
}
Write-Host '[✓] Konfigurasi .env ditemukan.' -ForegroundColor Green

# 2. Setup Virtual Environment Python & Install Dependensi
Write-Host ''
Write-Host '[1/3] Menyiapkan environment Python...' -ForegroundColor Yellow
if (-not (Test-Path 'venv')) {
    Write-Host '-> Virtual environment (venv) tidak ditemukan. Membuat baru...' -ForegroundColor Gray
    python -m venv venv
}

Write-Host '-> Mengaktifkan venv...' -ForegroundColor Gray
& .\venv\Scripts\Activate.ps1

Write-Host '-> Memasang dependensi Python...' -ForegroundColor Gray
pip install -r pipeline/requirements.txt --quiet
Write-Host '[✓] Environment Python siap.' -ForegroundColor Green

# 3. Opsi Menjalankan Python Pipeline
Write-Host ''
$runPipeline = Read-Host '[2/3] Apakah Anda ingin menjalankan Python Data Pipeline (tarik data & hitung AI) sekarang? (Y/N)'
if ($runPipeline -eq 'Y' -or $runPipeline -eq 'y') {
    Write-Host '-> Menjalankan pipeline/main.py...' -ForegroundColor Yellow
    python pipeline/main.py
    Write-Host '[✓] Pipeline selesai dieksekusi.' -ForegroundColor Green
} else {
    Write-Host '-> Menurunkan langkah pipeline. Lewati ke Next.js...' -ForegroundColor Gray
}

# 4. Jalankan Frontend Next.js
Write-Host ''
Write-Host '[3/3] Menyiapkan Frontend Next.js...' -ForegroundColor Yellow
if (-not (Test-Path 'web\node_modules')) {
    Write-Host '-> Folder node_modules tidak ditemukan. Memasang dependensi npm...' -ForegroundColor Gray
    Set-Location web
    npm install
    Set-Location ..
}

Write-Host '-> Memulai Next.js Development Server...' -ForegroundColor Yellow
Write-Host '-> Aplikasi akan berjalan di http://localhost:3000' -ForegroundColor Green
Write-Host '-> Tekan Ctrl+C di terminal ini jika ingin menghentikan server.' -ForegroundColor Gray
Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray

# Pastikan file .env disalin ke folder web agar Next.js bisa mendeteksi environment variables
if (Test-Path '.env') {
    Write-Host '-> Menyalin file .env ke folder web...' -ForegroundColor Gray
    Copy-Item -Path '.env' -Destination 'web\.env' -Force
}

Set-Location web
npm run dev
