-- Create setting table
CREATE TABLE IF NOT EXISTS public.setting (
  id_setting SERIAL PRIMARY KEY,
  nama_perusahaan TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  path_logo TEXT,
  path_kartu_member TEXT,
  diskon INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.setting ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage settings)
CREATE POLICY "Admins can manage settings" ON public.setting
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Insert default settings
INSERT INTO public.setting (nama_perusahaan, alamat, telepon, diskon) 
VALUES ('SVJ Outdoor', 'Jl. Raya No. 123', '08123456789', 0)
ON CONFLICT DO NOTHING;
