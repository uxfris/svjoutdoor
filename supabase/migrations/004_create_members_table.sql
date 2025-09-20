-- Create member table
CREATE TABLE IF NOT EXISTS public.member (
  id_member SERIAL PRIMARY KEY,
  kode_member TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage members" ON public.member
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

CREATE POLICY "Cashiers can view members" ON public.member
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level IN (1, 2)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_member_kode ON public.member(kode_member);
CREATE INDEX IF NOT EXISTS idx_member_nama ON public.member(nama);
