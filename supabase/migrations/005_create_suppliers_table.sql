-- Create supplier table
CREATE TABLE IF NOT EXISTS public.supplier (
  id_supplier SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage suppliers" ON public.supplier
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_nama ON public.supplier(nama);
