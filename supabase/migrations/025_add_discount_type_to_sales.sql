-- Add discount_type column to penjualan table
ALTER TABLE public.penjualan 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'amount'));

-- Update existing records to have percentage type (since they were stored as percentages)
UPDATE public.penjualan 
SET discount_type = 'percentage' 
WHERE discount_type IS NULL;

-- Make discount_type NOT NULL after setting default values
ALTER TABLE public.penjualan 
ALTER COLUMN discount_type SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.penjualan.discount_type IS 'Type of discount: percentage or amount';
COMMENT ON COLUMN public.penjualan.diskon IS 'Discount value: percentage (0-100) or amount in rupiah';
