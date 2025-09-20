-- Add sample categories for testing
-- This migration adds some sample categories to help with development and testing

INSERT INTO public.kategori (nama_kategori, harga_jual, stok, kode_kategori) VALUES
('Tenda Dome 2 Orang', 250000, 10, 'TD-001'),
('Tenda Dome 4 Orang', 350000, 8, 'TD-002'),
('Tenda Family 6 Orang', 450000, 5, 'TF-001'),
('Sleeping Bag Standard', 150000, 20, 'SB-001'),
('Sleeping Bag Premium', 250000, 15, 'SB-002'),
('Matras Camping', 75000, 25, 'MC-001'),
('Ransel 40L', 200000, 12, 'RS-001'),
('Ransel 60L', 300000, 8, 'RS-002'),
('Kompor Portable', 120000, 18, 'KP-001'),
('Lampu LED Camping', 50000, 30, 'LC-001'),
('Tongkat Hiking', 80000, 15, 'TH-001'),
('Sepatu Hiking', 400000, 10, 'SH-001'),
('Jaket Gunung', 300000, 12, 'JG-001'),
('Celana Hiking', 200000, 15, 'CH-001'),
('Topi Adventure', 75000, 20, 'TA-001')
ON CONFLICT (nama_kategori) DO NOTHING;

-- Update timestamps
UPDATE public.kategori SET 
  created_at = NOW(),
  updated_at = NOW()
WHERE created_at IS NULL;
