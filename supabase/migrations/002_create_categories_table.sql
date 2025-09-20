-- Create kategori table
CREATE TABLE IF NOT EXISTS public.kategori (
  id_kategori SERIAL PRIMARY KEY,
  nama_kategori TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage categories)
CREATE POLICY "Admins can manage categories" ON public.kategori
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kategori_nama ON public.kategori(nama_kategori);
