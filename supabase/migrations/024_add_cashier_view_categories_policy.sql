-- Add policy to allow cashiers to view categories
-- This is needed for the POS system to work properly

CREATE POLICY "Cashiers can view categories" ON public.kategori
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.level IN (1, 2)
    )
  );
