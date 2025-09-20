-- Create produk table
CREATE TABLE IF NOT EXISTS public.produk (
  id_produk SERIAL PRIMARY KEY,
  id_kategori INTEGER REFERENCES public.kategori(id_kategori) ON DELETE RESTRICT,
  nama_produk TEXT UNIQUE NOT NULL,
  merk TEXT,
  harga_beli INTEGER NOT NULL DEFAULT 0,
  diskon INTEGER NOT NULL DEFAULT 0,
  harga_jual INTEGER NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  kode_produk TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.produk ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage products" ON public.produk
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

CREATE POLICY "Cashiers can view products" ON public.produk
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level IN (1, 2)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON public.produk(id_kategori);
CREATE INDEX IF NOT EXISTS idx_produk_nama ON public.produk(nama_produk);
CREATE INDEX IF NOT EXISTS idx_produk_kode ON public.produk(kode_produk);
CREATE INDEX IF NOT EXISTS idx_produk_stok ON public.produk(stok);
