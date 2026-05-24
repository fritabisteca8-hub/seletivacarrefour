
CREATE TABLE public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits" ON public.page_visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can update visits" ON public.page_visits FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read visits" ON public.page_visits FOR SELECT TO anon USING (true);

CREATE INDEX idx_page_visits_session ON public.page_visits (session_id);
CREATE INDEX idx_page_visits_last_seen ON public.page_visits (last_seen_at);
