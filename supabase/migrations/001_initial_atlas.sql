-- supabase/migrations/001_initial_atlas.sql
-- Black Cinema Atlas: PostgreSQL + pgvector Schema (1,000+ Films Scale)

-- Enable pgvector for semantic vibe & coming-of-age search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE curation_tier AS ENUM ('core_curated', 'extended_atlas', 'community_spotlight');

CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  imdb_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  decade INTEGER GENERATED ALWAYS AS ((release_year / 10) * 10) STORED,
  runtime_minutes INTEGER,
  curation_tier curation_tier DEFAULT 'extended_atlas',
  
  -- Visual & Atlas Assets
  poster_path TEXT NOT NULL,
  backdrop_path TEXT,
  atlas_sprite_index INTEGER,          -- Index in pre-packed WebP texture atlas
  dominant_hex_color CHAR(7),          -- Used for Voronoi cell glow & ambient UI
  initial_x REAL,                      -- Pre-computed UMAP/force X seed (-1.0 to 1.0)
  initial_y REAL,                      -- Pre-computed UMAP/force Y seed (-1.0 to 1.0)

  -- Rich Editorial & Cultural Taxonomy
  logline TEXT,
  editorial_why_it_matters TEXT,       -- Curated or AI-verified cultural context
  primary_movement TEXT,               -- e.g., 'L.A. Rebellion', '90s New Jack', 'Afrofuturism', 'Modern Indie Coming-of-Age'
  diaspora_region TEXT[],              -- e.g., {'US South', 'Brooklyn', 'Black British', 'West Africa'}
  coming_of_age_tropes TEXT[],         -- e.g., {'First-Gen Identity', 'Summer Block Warmth', 'HBCU Life', 'Creative Hustle', 'Queer Youth'}
  sonic_profile JSONB,                 -- {"genres": ["90s R&B", "Boom-Bap"], "needle_drop_density": "high", "notable_artists": ["Erykah Badu"]}
  visual_mood_tags TEXT[],             -- e.g., {'Warm Tungsten', '16mm Grain', 'Neon Night'}
  
  -- Streaming & Monetization (Updated via Watchmode/JustWatch cron)
  streaming_sources JSONB DEFAULT '[]'::jsonb, -- [{"provider": "Criterion", "type": "sub", "affiliate_url": "..."}]
  
  -- Semantic Vector (1536 dims) for The Griot Concierge
  vibe_embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Explicit "Every Story Connects" Graph Edges
CREATE TYPE connection_type AS ENUM (
  'thematic_twin',       -- Shared emotional arc / coming-of-age journey
  'sonic_cousin',        -- Shared soundtrack era or musical DNA
  'directorial_lineage', -- Direct influence or shared creative crew
  'place_and_era',       -- Same neighborhood/city across decades (e.g., Bed-Stuy 1989 vs 2024)
  'diaspora_bridge'      -- Connects US Black cinema to UK/African/Caribbean counterpart
);

CREATE TABLE IF NOT EXISTS film_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  target_film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  connection_kind connection_type NOT NULL,
  strength REAL DEFAULT 0.8 CHECK (strength BETWEEN 0.1 AND 1.0),
  explanation TEXT NOT NULL,           -- e.g. "Both capture a single humid summer day in Brooklyn where youth ambition collides with neighborhood gentrification."
  UNIQUE(source_film_id, target_film_id, connection_kind)
);

-- User Profiles, Watchlists & Taste Vectors
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  handle TEXT UNIQUE,
  favorite_movements TEXT[],
  subscribed_services TEXT[],          -- e.g., {'Netflix', 'Criterion', 'Max', 'KweliTV'}
  taste_embedding vector(1536),        -- Dynamically updated average of liked/watched films
  is_griot_plus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('want_to_watch', 'watched', 'favorite')),
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, film_id)
);

-- Collaborative "Movie Night" Rooms
CREATE TABLE IF NOT EXISTS movie_night_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_user_id UUID REFERENCES user_profiles(id),
  active_filters JSONB,                -- {"max_runtime": 115, "vibe": "Coming of Age", "services": ["Netflix", "Prime"]}
  participants JSONB DEFAULT '[]'::jsonb,
  ai_shortlist UUID[],                 -- Top 3–5 mediated film IDs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cultural Art & Cinema Shop Orders & Creator Support
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  filmmaker_fund_contribution_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_films_vibe_embedding ON films USING ivfflat (vibe_embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX IF NOT EXISTS idx_films_decade ON films(decade);
CREATE INDEX IF NOT EXISTS idx_films_tier ON films(curation_tier);
