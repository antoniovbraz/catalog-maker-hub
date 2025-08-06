-- Table to store UI theme preferences
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  tertiary_color TEXT NOT NULL,
  font_heading TEXT NOT NULL,
  font_body TEXT NOT NULL,
  h1_size TEXT NOT NULL,
  h2_size TEXT NOT NULL,
  body_size TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default values
INSERT INTO public.theme_settings (
  primary_color,
  secondary_color,
  tertiary_color,
  font_heading,
  font_body,
  h1_size,
  h2_size,
  body_size
) VALUES (
  '#2580ff',
  '#4a5568',
  '#718096',
  'Roboto',
  'Open Sans',
  '2.5rem',
  '2rem',
  '1rem'
);

-- Enable RLS and policies
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theme settings"
  ON public.theme_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins manage theme settings"
  ON public.theme_settings FOR ALL
  USING (get_current_user_role() = 'super_admin')
  WITH CHECK (get_current_user_role() = 'super_admin');
