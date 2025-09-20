-- Add payment_method field to penjualan table
ALTER TABLE public.penjualan 
ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer'));

-- Add comment for clarity
COMMENT ON COLUMN public.penjualan.payment_method IS 'Payment method used for the sale: cash or transfer';

-- Create index for payment method queries
CREATE INDEX IF NOT EXISTS idx_penjualan_payment_method ON public.penjualan(payment_method);
