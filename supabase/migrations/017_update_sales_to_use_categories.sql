-- Add new column for kategori reference in penjualan_detail
ALTER TABLE public.penjualan_detail 
ADD COLUMN id_kategori INTEGER REFERENCES public.kategori(id_kategori) ON DELETE RESTRICT;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_penjualan_detail_kategori ON public.penjualan_detail(id_kategori);

-- Note: We'll keep id_produk for now during transition, will remove in later migration
