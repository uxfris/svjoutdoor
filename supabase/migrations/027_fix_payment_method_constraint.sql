-- Fix payment method constraint violation
-- This migration ensures all payment_method values are valid

-- First, check for any invalid payment_method values
-- Update any remaining 'transfer' values to 'debit'
UPDATE public.penjualan 
SET payment_method = 'debit' 
WHERE payment_method = 'transfer';

-- Update any other invalid values to 'cash' as fallback
UPDATE public.penjualan 
SET payment_method = 'cash' 
WHERE payment_method NOT IN ('cash', 'debit');

-- Ensure the constraint is properly applied
ALTER TABLE public.penjualan 
DROP CONSTRAINT IF EXISTS penjualan_payment_method_check;

ALTER TABLE public.penjualan 
ADD CONSTRAINT penjualan_payment_method_check 
CHECK (payment_method IN ('cash', 'debit'));

-- Verify the changes
SELECT payment_method, COUNT(*) as count 
FROM public.penjualan 
GROUP BY payment_method;
