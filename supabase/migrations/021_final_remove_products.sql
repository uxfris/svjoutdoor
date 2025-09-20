-- Final cleanup: Remove all product references and products table

-- First, remove the old id_produk column from penjualan_detail
ALTER TABLE public.penjualan_detail DROP COLUMN IF EXISTS id_produk;

-- Remove the old id_produk column from pembelian_detail  
ALTER TABLE public.pembelian_detail DROP COLUMN IF EXISTS id_produk;

-- Drop the products table completely
DROP TABLE IF EXISTS public.produk CASCADE;

-- Drop any remaining product-related functions
DROP FUNCTION IF EXISTS decrease_stock(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS increase_stock(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_low_stock_products(INTEGER);

-- Add kode_kategori to kategori table for barcode support
ALTER TABLE public.kategori 
ADD COLUMN IF NOT EXISTS kode_kategori TEXT UNIQUE;

-- Create index for kode_kategori
CREATE INDEX IF NOT EXISTS idx_kategori_kode ON public.kategori(kode_kategori);

-- Update any existing categories to have a default code if they don't have one
UPDATE public.kategori 
SET kode_kategori = 'CAT' || id_kategori::text 
WHERE kode_kategori IS NULL OR kode_kategori = '';

-- Make kode_kategori NOT NULL
ALTER TABLE public.kategori 
ALTER COLUMN kode_kategori SET NOT NULL;
