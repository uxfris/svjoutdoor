-- Create pembelian table
CREATE TABLE IF NOT EXISTS public.pembelian (
  id_pembelian SERIAL PRIMARY KEY,
  id_supplier INTEGER REFERENCES public.supplier(id_supplier) ON DELETE RESTRICT,
  total_item INTEGER NOT NULL DEFAULT 0,
  total_harga INTEGER NOT NULL DEFAULT 0,
  diskon INTEGER NOT NULL DEFAULT 0,
  bayar INTEGER NOT NULL DEFAULT 0,
  id_user UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pembelian ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage purchases)
CREATE POLICY "Admins can manage purchases" ON public.pembelian
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pembelian_supplier ON public.pembelian(id_supplier);
CREATE INDEX IF NOT EXISTS idx_pembelian_user ON public.pembelian(id_user);
CREATE INDEX IF NOT EXISTS idx_pembelian_created_at ON public.pembelian(created_at);
