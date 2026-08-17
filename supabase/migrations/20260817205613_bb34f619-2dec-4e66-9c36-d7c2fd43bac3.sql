
ALTER TABLE public.page_visits ADD CONSTRAINT page_visits_session_id_key UNIQUE (session_id);

CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  extracted_name TEXT,
  doc_type TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO anon, authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can insert submissions" ON public.submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public can read submissions" ON public.submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public can update submissions" ON public.submissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public can delete submissions" ON public.submissions FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
