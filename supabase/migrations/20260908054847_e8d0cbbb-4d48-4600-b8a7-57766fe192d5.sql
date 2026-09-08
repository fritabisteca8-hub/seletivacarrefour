CREATE TABLE public.admin_settings (
  id integer PRIMARY KEY DEFAULT 1,
  password_hash text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_singleton CHECK (id = 1)
);
INSERT INTO public.admin_settings (id, password_hash) VALUES (1, NULL);
GRANT SELECT, INSERT, UPDATE ON public.admin_settings TO anon, authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read admin settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "update admin settings" ON public.admin_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "insert admin settings" ON public.admin_settings FOR INSERT WITH CHECK (true);