-- Add pricing and stock fields to kategori table
ALTER TABLE public.kategori 
ADD COLUMN harga_jual INTEGER NOT NULL DEFAULT 0,
ADD COLUMN stok INTEGER NOT NULL DEFAULT 0;

-- Create index for better performance on pricing queries
CREATE INDEX IF NOT EXISTS idx_kategori_harga_jual ON public.kategori(harga_jual);
CREATE INDEX IF NOT EXISTS idx_kategori_stok ON public.kategori(stok);

-- Update the updated_at timestamp
UPDATE public.kategori SET updated_at = NOW() WHERE updated_at IS NOT NULL;
