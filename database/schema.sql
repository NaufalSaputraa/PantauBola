-- DDL Schema untuk PantauBola (Supabase PostgreSQL)
-- Inisialisasi Tabel dan Kebijakan Row Level Security (RLS)

-- 1. Membuat Tabel Teams (Klub)
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY, -- Menggunakan ID asli dari Football-Data.org
    name VARCHAR(100) NOT NULL,
    logo_url TEXT, -- Menyimpan URL eksternal gambar logo klub
    league VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Membuat Tabel Standings (Klasemen Liga)
CREATE TABLE IF NOT EXISTS standings (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
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
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY, -- Menggunakan ID asli dari Football-Data.org
    home_team_id INT,
    away_team_id INT,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_score SMALLINT, -- Bernilai NULL jika belum tanding
    away_score SMALLINT, -- Bernilai NULL jika belum tanding
    home_xg NUMERIC(4,2), -- Nilai Expected Goals home
    away_xg NUMERIC(4,2), -- Nilai Expected Goals away
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- Status: SCHEDULED, LIVE, FINISHED, POSTPONED
    league VARCHAR(50) NOT NULL,
    matchday SMALLINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Membuat Tabel AI_Predictions (Hasil Kalkulasi & Teks Analisis Gemini)
CREATE TABLE IF NOT EXISTS ai_predictions (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
    home_prob NUMERIC(5,2), -- Format persen (misal: 65.50)
    draw_prob NUMERIC(5,2), -- Format persen (misal: 20.00)
    away_prob NUMERIC(5,2), -- Format persen (misal: 14.50)
    predicted_home_score SMALLINT,
    predicted_away_score SMALLINT,
    analysis_text TEXT, 
    key_factors TEXT[], -- Poin-poin analisis kunci dalam format array
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Mengaktifkan RLS ke seluruh tabel
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Kebijakan SELECT: Izinkan pembacaan publik tanpa batasan login (Anon Key)
CREATE POLICY "Allow public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ai_predictions" ON ai_predictions FOR SELECT USING (true);
