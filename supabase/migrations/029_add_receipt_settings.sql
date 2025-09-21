-- Add receipt configuration settings to the setting table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'setting' AND column_name = 'receipt_width_mm') THEN
        ALTER TABLE public.setting ADD COLUMN receipt_width_mm INTEGER DEFAULT 75;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'setting' AND column_name = 'receipt_font_size') THEN
        ALTER TABLE public.setting ADD COLUMN receipt_font_size INTEGER DEFAULT 12;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'setting' AND column_name = 'receipt_paper_type') THEN
        ALTER TABLE public.setting ADD COLUMN receipt_paper_type VARCHAR(20) DEFAULT 'thermal_75mm';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'setting' AND column_name = 'receipt_footer') THEN
        ALTER TABLE public.setting ADD COLUMN receipt_footer TEXT DEFAULT '';
    END IF;
END $$;

-- Update existing settings with default values (only if columns are NULL)
UPDATE public.setting 
SET 
  receipt_width_mm = COALESCE(receipt_width_mm, 75),
  receipt_font_size = COALESCE(receipt_font_size, 12),
  receipt_paper_type = COALESCE(receipt_paper_type, 'thermal_75mm'),
  receipt_footer = COALESCE(receipt_footer, '')
WHERE receipt_width_mm IS NULL OR receipt_font_size IS NULL OR receipt_paper_type IS NULL OR receipt_footer IS NULL;
