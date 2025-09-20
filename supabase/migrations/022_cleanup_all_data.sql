-- Cleanup all data from all tables
-- This migration will clear all data while preserving table structure

-- Disable foreign key checks temporarily for faster cleanup
SET session_replication_role = replica;

-- Clear all data from tables in reverse dependency order
-- (child tables first, then parent tables)

-- Clear detail tables first
TRUNCATE TABLE public.penjualan_detail CASCADE;
TRUNCATE TABLE public.pembelian_detail CASCADE;

-- Clear main transaction tables
TRUNCATE TABLE public.penjualan CASCADE;
TRUNCATE TABLE public.pembelian CASCADE;

-- Clear reference data tables
TRUNCATE TABLE public.pengeluaran CASCADE;
TRUNCATE TABLE public.member CASCADE;
TRUNCATE TABLE public.supplier CASCADE;
TRUNCATE TABLE public.kategori CASCADE;

-- Clear settings (but keep one default record)
DELETE FROM public.setting WHERE id_setting > 1;
-- Reset the sequence to start from 1
ALTER SEQUENCE public.setting_id_setting_seq RESTART WITH 1;

-- Clear users table (but keep at least one admin user for login)
-- Only delete users if there are more than 1, keep the first admin
DELETE FROM public.users 
WHERE id NOT IN (
    SELECT id FROM public.users 
    WHERE level = 1 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Reset sequences for all tables
ALTER SEQUENCE public.kategori_id_kategori_seq RESTART WITH 1;
ALTER SEQUENCE public.member_id_member_seq RESTART WITH 1;
ALTER SEQUENCE public.supplier_id_supplier_seq RESTART WITH 1;
ALTER SEQUENCE public.penjualan_id_penjualan_seq RESTART WITH 1;
ALTER SEQUENCE public.penjualan_detail_id_penjualan_detail_seq RESTART WITH 1;
ALTER SEQUENCE public.pembelian_id_pembelian_seq RESTART WITH 1;
ALTER SEQUENCE public.pembelian_detail_id_pembelian_detail_seq RESTART WITH 1;
ALTER SEQUENCE public.pengeluaran_id_pengeluaran_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Insert default settings if none exist
INSERT INTO public.setting (
    nama_perusahaan, 
    alamat, 
    telepon, 
    diskon
) VALUES (
    'SVJ Outdoor',
    'Jl. Contoh Alamat No. 123',
    '08123456789',
    0
) ON CONFLICT DO NOTHING;

-- Note: Default admin user will be created through Supabase Auth
-- The handle_new_user() trigger will automatically create the public.users record
-- when a user is created in auth.users

-- Update timestamps for all tables
UPDATE public.setting SET updated_at = NOW() WHERE id_setting = 1;
UPDATE public.users SET updated_at = NOW() WHERE level = 1;
