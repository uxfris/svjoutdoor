-- Create pengeluaran table
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id_pengeluaran SERIAL PRIMARY KEY,
  deskripsi TEXT NOT NULL,
  nominal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage expenses)
CREATE POLICY "Admins can manage expenses" ON public.pengeluaran
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level = 1
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pengeluaran_created_at ON public.pengeluaran(created_at);
