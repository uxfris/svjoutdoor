-- Remove old product-related foreign key constraints and columns
ALTER TABLE public.penjualan_detail DROP COLUMN IF EXISTS id_produk;

-- Drop the produk table
DROP TABLE IF EXISTS public.produk CASCADE;

-- Drop old stock functions that reference products
DROP FUNCTION IF EXISTS decrease_stock(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS increase_stock(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_low_stock_products(INTEGER);
