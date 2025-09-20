-- Create penjualan_detail table
CREATE TABLE IF NOT EXISTS public.penjualan_detail (
  id_penjualan_detail SERIAL PRIMARY KEY,
  id_penjualan INTEGER REFERENCES public.penjualan(id_penjualan) ON DELETE CASCADE,
  id_produk INTEGER REFERENCES public.produk(id_produk) ON DELETE RESTRICT,
  harga_jual INTEGER NOT NULL DEFAULT 0,
  jumlah INTEGER NOT NULL DEFAULT 0,
  diskon INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.penjualan_detail ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view sales details for their sales" ON public.penjualan_detail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.penjualan 
      WHERE penjualan.id_penjualan = penjualan_detail.id_penjualan 
      AND (penjualan.id_user = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE users.id = auth.uid() AND users.level = 1
           ))
    )
  );

CREATE POLICY "Cashiers can create sales details" ON public.penjualan_detail
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.penjualan 
      WHERE penjualan.id_penjualan = penjualan_detail.id_penjualan 
      AND penjualan.id_user = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.level IN (1, 2)
      )
    )
  );

CREATE POLICY "Admins can manage all sales details" ON public.penjualan_detail
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_penjualan_detail_penjualan ON public.penjualan_detail(id_penjualan);
CREATE INDEX IF NOT EXISTS idx_penjualan_detail_produk ON public.penjualan_detail(id_produk);
