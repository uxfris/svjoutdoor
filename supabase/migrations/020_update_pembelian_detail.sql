-- Add new column for kategori reference in pembelian_detail
ALTER TABLE public.pembelian_detail 
ADD COLUMN id_kategori INTEGER REFERENCES public.kategori(id_kategori) ON DELETE RESTRICT;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_pembelian_detail_kategori ON public.pembelian_detail(id_kategori);

-- Note: We'll keep id_produk for now during transition, will remove in later migration
