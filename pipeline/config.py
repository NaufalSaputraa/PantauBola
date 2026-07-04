import os
from dotenv import load_dotenv

# Muat file .env dari folder root proyek jika ada
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
# PENTING: Backend Python menggunakan Service Role Key untuk melewati (bypass) kebijakan RLS
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FOOTBALL_DATA_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY")

# Daftar Liga yang Didukung (Football-Data.org League Codes)
SUPPORTED_LEAGUES = {
    'PL': 'Premier League (Inggris)',
    'PD': 'La Liga (Spanyol)',
    'SA': 'Serie A (Italia)',
    'BL1': 'Bundesliga (Jerman)',
    'CL': 'UEFA Champions League'
}

# Konfigurasi Rate Limit (Football-Data.org free tier membatasi 10 req/min)
API_DELAY_SECONDS = 7.0

# Validasi Variabel Lingkungan
if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, FOOTBALL_DATA_API_KEY]):
    print("WARNING: Beberapa environment variable utama belum disetel. Pastikan file .env sudah dikonfigurasi.")
