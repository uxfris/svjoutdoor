-- Create penjualan table
CREATE TABLE IF NOT EXISTS public.penjualan (
  id_penjualan SERIAL PRIMARY KEY,
  id_member INTEGER REFERENCES public.member(id_member) ON DELETE SET NULL,
  total_item INTEGER NOT NULL DEFAULT 0,
  total_harga INTEGER NOT NULL DEFAULT 0,
  diskon INTEGER NOT NULL DEFAULT 0,
  bayar INTEGER NOT NULL DEFAULT 0,
  diterima INTEGER NOT NULL DEFAULT 0,
  id_user UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.penjualan ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sales" ON public.penjualan
  FOR SELECT USING (
    id_user = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

CREATE POLICY "Cashiers can create sales" ON public.penjualan
  FOR INSERT WITH CHECK (
    id_user = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level IN (1, 2)
    )
  );

CREATE POLICY "Admins can manage all sales" ON public.penjualan
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_penjualan_user ON public.penjualan(id_user);
CREATE INDEX IF NOT EXISTS idx_penjualan_member ON public.penjualan(id_member);
CREATE INDEX IF NOT EXISTS idx_penjualan_created_at ON public.penjualan(created_at);
