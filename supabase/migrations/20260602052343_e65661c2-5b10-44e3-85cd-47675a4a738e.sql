
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leaderboard_entries_score_idx
  ON public.leaderboard_entries (score DESC, created_at ASC);

GRANT SELECT ON public.leaderboard_entries TO anon, authenticated;
GRANT ALL ON public.leaderboard_entries TO service_role;

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read leaderboard"
  ON public.leaderboard_entries FOR SELECT
  TO anon, authenticated
  USING (true);
