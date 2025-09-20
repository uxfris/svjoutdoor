-- Create function to decrease category stock
CREATE OR REPLACE FUNCTION decrease_category_stock(category_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE kategori 
  SET stok = stok - quantity 
  WHERE id_kategori = category_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category with id % not found', category_id;
  END IF;
  
  IF (SELECT stok FROM kategori WHERE id_kategori = category_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for category %', category_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increase category stock
CREATE OR REPLACE FUNCTION increase_category_stock(category_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE kategori 
  SET stok = stok + quantity 
  WHERE id_kategori = category_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category with id % not found', category_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get low stock categories
CREATE OR REPLACE FUNCTION get_low_stock_categories(threshold INTEGER DEFAULT 10)
RETURNS TABLE (
  id_kategori INTEGER,
  nama_kategori TEXT,
  stok INTEGER,
  harga_jual INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id_kategori,
    k.nama_kategori,
    k.stok,
    k.harga_jual
  FROM kategori k
  WHERE k.stok <= threshold
  ORDER BY k.stok ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
