-- Create pembelian_detail table
CREATE TABLE IF NOT EXISTS public.pembelian_detail (
  id_pembelian_detail SERIAL PRIMARY KEY,
  id_pembelian INTEGER REFERENCES public.pembelian(id_pembelian) ON DELETE CASCADE,
  id_produk INTEGER REFERENCES public.produk(id_produk) ON DELETE RESTRICT,
  harga_beli INTEGER NOT NULL DEFAULT 0,
  jumlah INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pembelian_detail ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage purchase details)
CREATE POLICY "Admins can manage purchase details" ON public.pembelian_detail
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pembelian_detail_pembelian ON public.pembelian_detail(id_pembelian);
CREATE INDEX IF NOT EXISTS idx_pembelian_detail_produk ON public.pembelian_detail(id_produk);
