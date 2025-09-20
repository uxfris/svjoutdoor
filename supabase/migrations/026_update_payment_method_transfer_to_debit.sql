-- Update payment method from 'transfer' to 'debit'
-- This migration updates existing data and constraints

-- First, update existing records that have 'transfer' as payment method
UPDATE public.penjualan 
SET payment_method = 'debit' 
WHERE payment_method = 'transfer';

-- Update the check constraint to allow 'debit' instead of 'transfer'
ALTER TABLE public.penjualan 
DROP CONSTRAINT IF EXISTS penjualan_payment_method_check;

ALTER TABLE public.penjualan 
ADD CONSTRAINT penjualan_payment_method_check 
CHECK (payment_method IN ('cash', 'debit'));

-- Update the comment for clarity
COMMENT ON COLUMN public.penjualan.payment_method IS 'Payment method used for the sale: cash or debit';

-- Verify the changes
SELECT payment_method, COUNT(*) as count 
FROM public.penjualan 
GROUP BY payment_method;
