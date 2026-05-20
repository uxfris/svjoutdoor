-- =============================================================================
-- Local / staging seed — production-style volume and relationships
-- =============================================================================
-- This file is synthetic demo data (no real customers or financial history).
-- Categories come from migration 023; this adds users, suppliers, members,
-- sales, purchases, and expenses typical of a running outdoor retail shop.
--
-- To use an actual production snapshot instead (handle PII carefully):
--   1. supabase link --project-ref <ref>
--   2. supabase db dump --data-only --schema public --schema auth \
--        -f supabase/prod-data.sql
--   3. Edit the dump (remove secrets you do not want locally), then point
--      config.toml [db.seed] sql_paths at that file or merge statements here.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Clear transactional tables (keeps kategori from migrations + auth stable)
-- ---------------------------------------------------------------------------
TRUNCATE TABLE
  public.penjualan_detail,
  public.penjualan,
  public.pembelian_detail,
  public.pembelian,
  public.pengeluaran,
  public.member,
  public.supplier
RESTART IDENTITY CASCADE;

-- Remove prior seed auth users (cascades identities + public.users)
DELETE FROM auth.users
WHERE email IN (
  'admin@svjoutdoor.local',
  'cashier@svjoutdoor.local'
);

-- ---------------------------------------------------------------------------
-- Auth + app users (passwords are for LOCAL DEV ONLY)
-- Admin:    Admin123!
-- Cashier:  Cashier123!
-- ---------------------------------------------------------------------------
-- Token columns must be '' (not NULL): GoTrue scans them as strings
-- (see https://github.com/supabase/auth/issues/1940 )
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@svjoutdoor.local',
    extensions.crypt('Admin123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin SVJ"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'cashier@svjoutdoor.local',
    extensions.crypt('Cashier123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Kasir Utama"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'sub', '11111111-1111-1111-1111-111111111111',
      'email', 'admin@svjoutdoor.local',
      'email_verified', true
    ),
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-2222-2222-222222222222',
      'email', 'cashier@svjoutdoor.local',
      'email_verified', true
    ),
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now(),
    now()
  );

-- Trigger created rows as level = 2 (cashier); promote admin
UPDATE public.users
SET
  level = 1,
  name = 'Admin SVJ',
  updated_at = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.users
SET
  name = 'Kasir Utama',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

-- ---------------------------------------------------------------------------
-- Toko / receipt settings (single row from migration)
-- ---------------------------------------------------------------------------
UPDATE public.setting
SET
  nama_perusahaan = 'SVJ Outdoor',
  alamat = 'Jl. Raya Adventure No. 88, Bogor',
  telepon = '0251-1234567',
  diskon = 5,
  receipt_width_mm = 75,
  receipt_font_size = 11,
  receipt_paper_type = 'thermal_75mm',
  receipt_footer = 'Terima kasih — barang retur max 3 hari (struk & tag)',
  updated_at = now()
WHERE id_setting = (SELECT min(id_setting) FROM public.setting);

-- ---------------------------------------------------------------------------
-- Kategori tambahan (migration 023 = 15 item dasar; ini melengkapi katalog demo)
-- ---------------------------------------------------------------------------
INSERT INTO public.kategori (nama_kategori, harga_jual, stok, kode_kategori) VALUES
  ('Tenda Ultralight 1 Orang', 320000, 6, 'TD-003'),
  ('Fly Sheet 3x3 m', 95000, 14, 'FS-001'),
  ('Terpal Waterproof 4x6', 125000, 10, 'TP-001'),
  ('Hammock Single + Tali', 185000, 12, 'HM-001'),
  ('Headlamp LED Recharge', 85000, 22, 'HL-001'),
  ('Senter LED 1000 Lumens', 65000, 28, 'ST-001'),
  ('Cooler Box 28L', 275000, 7, 'CB-001'),
  ('Botol Stainless 750ml', 45000, 40, 'BT-001'),
  ('Set Piring Mangkok Camping', 55000, 18, 'PK-001'),
  ('Tas Dry Bag 20L', 110000, 16, 'DB-001'),
  ('Rain Cover Ransel 40-60L', 60000, 20, 'RC-001'),
  ('Carabiner Set 5 pcs', 35000, 35, 'CR-001'),
  ('Tali Prusik 5m', 25000, 30, 'TL-001'),
  ('Sarung Tangan Hiking', 55000, 24, 'SG-001'),
  ('Kaos Kaki Trekking 3 pasang', 40000, 32, 'KK-001'),
  ('Jaket Windbreaker', 220000, 11, 'JW-001'),
  ('Celana Convertible', 175000, 13, 'CC-001'),
  ('Sandal Gunung', 95000, 18, 'SD-001'),
  ('Pelindung Matahari SPF50', 35000, 26, 'SS-001'),
  ('P3K Camping Kit', 90000, 14, 'PK-002')
ON CONFLICT (nama_kategori) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Suppliers & members
-- ---------------------------------------------------------------------------
INSERT INTO public.supplier (nama, alamat, telepon) VALUES
  ('PT Alam Supply', 'Jakarta Utara', '021-5550101'),
  ('CV Gunung Jaya', 'Bandung', '022-5550202'),
  ('UD Camping Nusantara', 'Surabaya', '031-5550303');

INSERT INTO public.member (kode_member, nama, alamat, telepon) VALUES
  ('MBR-00001', 'Budi Santoso', 'Bogor Tengah', '0812-10001001'),
  ('MBR-00002', 'Siti Aminah', 'Cibinong', '0812-10001002'),
  ('MBR-00003', 'Raka Wijaya', 'Depok', '0812-10001003'),
  ('MBR-00004', 'Dewi Lestari', 'Sentul', '0812-10001004'),
  ('MBR-00005', 'Walk-in', null, null);

-- ---------------------------------------------------------------------------
-- Penjualan (mixed payment, diskon persentase / nominal)
-- id_kategori resolved by kode from migration 023
-- ---------------------------------------------------------------------------
INSERT INTO public.penjualan (
  id_member,
  total_item,
  total_harga,
  diskon,
  bayar,
  diterima,
  id_user,
  payment_method,
  discount_type,
  created_at
)
VALUES
  (1, 4, 900000, 0, 900000, 900000, '22222222-2222-2222-2222-222222222222', 'cash', 'percentage', now() - interval '6 days'),
  (2, 5, 540000, 10, 540000, 550000, '22222222-2222-2222-2222-222222222222', 'debit', 'percentage', now() - interval '5 days'),
  (null, 1, 350000, 50000, 350000, 400000, '11111111-1111-1111-1111-111111111111', 'cash', 'amount', now() - interval '4 days'),
  (3, 6, 351250, 0, 351250, 351250, '22222222-2222-2222-2222-222222222222', 'debit', 'percentage', now() - interval '2 days'),
  (5, 2, 541500, 5, 550000, 550000, '22222222-2222-2222-2222-222222222222', 'cash', 'percentage', now() - interval '1 day');

INSERT INTO public.penjualan_detail (
  id_penjualan,
  id_kategori,
  harga_jual,
  jumlah,
  diskon,
  subtotal,
  discount_type
)
VALUES
  (1, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'TD-002'), 350000, 2, 0, 700000, 'percentage'),
  (1, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'SB-001'), 150000, 1, 0, 150000, 'percentage'),
  (1, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'LC-001'), 50000, 1, 0, 50000, 'percentage'),
  (2, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'RS-002'), 300000, 1, 0, 300000, 'percentage'),
  (2, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'MC-001'), 75000, 4, 0, 300000, 'percentage'),
  (3, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'SH-001'), 400000, 1, 0, 400000, 'percentage'),
  (4, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'LC-001'), 50000, 4, 0, 200000, 'percentage'),
  (4, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'TH-001'), 80000, 1, 0, 80000, 'percentage'),
  (4, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'TA-001'), 75000, 1, 5, 71250, 'percentage'),
  (5, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'TF-001'), 450000, 1, 0, 450000, 'percentage'),
  (5, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'KP-001'), 120000, 1, 0, 120000, 'percentage');

-- ---------------------------------------------------------------------------
-- Pembelian restock (admin user)
-- ---------------------------------------------------------------------------
INSERT INTO public.pembelian (
  id_supplier,
  total_item,
  total_harga,
  diskon,
  bayar,
  id_user,
  created_at
)
VALUES
  (1, 24, 2960000, 0, 2960000, '11111111-1111-1111-1111-111111111111', now() - interval '7 days'),
  (2, 30, 2250000, 0, 2250000, '11111111-1111-1111-1111-111111111111', now() - interval '3 days');

INSERT INTO public.pembelian_detail (id_pembelian, id_kategori, harga_beli, jumlah, subtotal)
VALUES
  (1, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'TD-001'), 180000, 8, 1440000),
  (1, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'SB-001'), 95000, 16, 1520000),
  (2, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'LC-001'), 32000, 30, 960000),
  (2, (SELECT id_kategori FROM public.kategori WHERE kode_kategori = 'MC-001'), 43000, 30, 1290000);

-- ---------------------------------------------------------------------------
-- Pengeluaran operasional
-- ---------------------------------------------------------------------------
INSERT INTO public.pengeluaran (deskripsi, nominal, created_at) VALUES
  ('Listrik & air toko', 1850000, now() - interval '30 days'),
  ('Gaji harian staff', 4200000, now() - interval '15 days'),
  ('Bensin antar barang', 350000, now() - interval '10 days'),
  ('Maintenance printer struk', 275000, now() - interval '3 days');

-- ---------------------------------------------------------------------------
-- Stok — rough alignment after penjualan / pembelian (no DB triggers)
-- ---------------------------------------------------------------------------
UPDATE public.kategori k
SET stok = v.stok, updated_at = now()
FROM (VALUES
  ('TD-001', 18),
  ('TD-002', 6),
  ('TF-001', 4),
  ('SB-001', 34),
  ('SB-002', 15),
  ('MC-001', 51),
  ('RS-001', 12),
  ('RS-002', 7),
  ('KP-001', 17),
  ('LC-001', 56),
  ('TH-001', 14),
  ('SH-001', 9),
  ('JG-001', 12),
  ('CH-001', 15),
  ('TA-001', 19),
  ('TD-003', 6),
  ('FS-001', 14),
  ('TP-001', 10),
  ('HM-001', 12),
  ('HL-001', 22),
  ('ST-001', 28),
  ('CB-001', 7),
  ('BT-001', 40),
  ('PK-001', 18),
  ('DB-001', 16),
  ('RC-001', 20),
  ('CR-001', 35),
  ('TL-001', 30),
  ('SG-001', 24),
  ('KK-001', 32),
  ('JW-001', 11),
  ('CC-001', 13),
  ('SD-001', 18),
  ('SS-001', 26),
  ('PK-002', 14)
) AS v(kode, stok)
WHERE k.kode_kategori = v.kode;

COMMIT;
